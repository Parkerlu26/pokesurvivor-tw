/* ============ firebase-config.runtime.js — 私人副本的 Firebase 設定 ============
 * 把 Firebase 主控台「你的應用程式 → SDK 設定」裡的那個物件貼在這裡。
 * 留 null 就是只用瀏覽器本機存檔（單人可玩，不能合作、不能排行榜）。
 * 這個檔案不會被 build 打包，改完重新整理即可，不必重建置。
 */
window.PS_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAHotyIe5NF9VAg2m4MCRdVYugOkFCtazw",
  authDomain: "pokesurvivor-tw-6b55e.firebaseapp.com",
  databaseURL: "https://pokesurvivor-tw-6b55e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "pokesurvivor-tw-6b55e",
  storageBucket: "pokesurvivor-tw-6b55e.firebasestorage.app",
  messagingSenderId: "66227122336",
  appId: "1:66227122336:web:f27c738728da53515959c5",
  };
/* 範例：
window.PS_FIREBASE_CONFIG = {
  apiKey: 'AIza...',
  authDomain: '你的專案.firebaseapp.com',
  projectId: '你的專案',
  storageBucket: '你的專案.firebasestorage.app',
  messagingSenderId: '1234567890',
  appId: '1:1234567890:web:abc123',
  databaseURL: 'https://你的專案-default-rtdb.asia-southeast1.firebasedatabase.app'
};
*/

/* 私人排行榜沿用此副本的 Firestore 規則，不向原版伺服器傳送登入 token。
 * 只有架好自己的簽章服務並部署對應驗證規則後，才填入自己的 HTTPS API。 */
window.PS_RANKING_SEAL_API = null;
