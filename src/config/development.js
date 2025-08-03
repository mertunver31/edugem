// Development mode konfigürasyonu
export const isDevelopmentMode = () => {
  return process.env.NODE_ENV === 'development' || 
         process.env.VITE_DEV_MODE === 'true' ||
         localStorage.getItem('devMode') === 'true';
};

// Development mode'u açıp kapatmak için fonksiyonlar
export const enableDevMode = () => {
  localStorage.setItem('devMode', 'true');
  window.location.reload();
};

export const disableDevMode = () => {
  localStorage.removeItem('devMode');
  window.location.reload();
};

// Development mode durumunu kontrol etmek için
export const toggleDevMode = () => {
  if (isDevelopmentMode()) {
    disableDevMode();
  } else {
    enableDevMode();
  }
}; 