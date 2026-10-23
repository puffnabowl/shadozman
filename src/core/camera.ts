// Rear camera access for the camera hunt. Gameplay calls startCamera() and
// draws over the returned <video>; core owns permissions, error messaging,
// and pausing the stream while the app is in the background.

export interface CameraHandle {
  /** Playing, rear-facing, muted, playsInline. Not attached to the DOM. */
  video: HTMLVideoElement;
  stop(): void;
}

const CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
};

/** Returns null (after telling the player why) when no camera can be used. */
export async function startCamera(): Promise<CameraHandle | null> {
  if (new URLSearchParams(location.search).has('nocamera')) return null;
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    showCameraNotice('The camera needs a secure (https) connection. Searching in the dark instead.');
    return null;
  }

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia(CONSTRAINTS);
  } catch (err) {
    showCameraNotice(messageFor(err));
    return null;
  }

  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.autoplay = true;

  let stopped = false;
  const attach = async (s: MediaStream) => {
    stream = s;
    video.srcObject = s;
    await video.play().catch(() => {});
  };
  const release = () => stream.getTracks().forEach((t) => t.stop());

  // Free the camera while the app is hidden, and pick it back up on return.
  const onVisibility = async () => {
    if (stopped) return;
    if (document.hidden) {
      release();
    } else {
      try {
        await attach(await navigator.mediaDevices.getUserMedia(CONSTRAINTS));
      } catch (err) {
        showCameraNotice(messageFor(err));
      }
    }
  };
  document.addEventListener('visibilitychange', onVisibility);

  await attach(stream);
  if (!video.videoWidth) await new Promise((r) => video.addEventListener('loadedmetadata', r, { once: true }));

  return {
    video,
    stop() {
      if (stopped) return;
      stopped = true;
      document.removeEventListener('visibilitychange', onVisibility);
      release();
      video.srcObject = null;
    },
  };
}

function messageFor(err: unknown): string {
  const name = (err as DOMException)?.name;
  if (name === 'NotAllowedError' || name === 'SecurityError')
    return 'Camera access is blocked. Allow it in your browser’s site settings to hunt with your camera. Searching in the dark instead.';
  if (name === 'NotFoundError' || name === 'OverconstrainedError')
    return 'No camera found on this device. Searching in the dark instead.';
  if (name === 'NotReadableError') return 'Another app is using the camera. Searching in the dark instead.';
  return 'The camera couldn’t start. Searching in the dark instead.';
}

let noticeTimer = 0;
function showCameraNotice(text: string) {
  let el = document.getElementById('camera-notice');
  if (!el) {
    el = document.createElement('div');
    el.id = 'camera-notice';
    el.setAttribute('role', 'status');
    el.addEventListener('click', () => el!.classList.remove('show'));
    document.body.appendChild(el);
  }
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => el!.classList.remove('show'), 5000);
}
