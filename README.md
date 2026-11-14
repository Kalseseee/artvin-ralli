# Artvin Ralli

3D tahta araba yarışı. Tek oyunculu mod ve 2–4 kişilik, davet kodlu özel odalar.

## Çalıştırma

Node.js 20 veya üzeri gerekir.

```sh
npm install
npm start
```

Oyun: http://127.0.0.1:4173

```sh
npm test
```

Çevrimiçi modu denemek için iki ayrı tarayıcı/sekme açın. İlk oyuncu **Arkadaşlarınla oyna → Oda oluştur** düğmesini kullanır. Diğeri oda koduyla katılır. Her iki oyuncu **Hazırım** der; oda sahibi başlatır. İkisi de aynı geri sayımı, parkuru ve sunucunun belirlediği yarış sonuçlarını görür.

## İnternete yayın

`127.0.0.1` bağlantısı başka bilgisayardaki arkadaşlara erişim sağlamaz. Arkadaşlarla internet üzerinden oynamak için bu Node.js sunucusu HTTPS ve WebSocket destekleyen bir barındırıcıya yayımlanmalıdır. `Dockerfile` ve `render.yaml` dağıtım tanımları dahildir. Sunucu, barındırıcının verdiği `PORT` değişkenini kullanır; `HOST=0.0.0.0` ile dinler. Alan adı belli olduğunda isteğe bağlı `PUBLIC_URL=https://oyun-adresi` ayarlanabilir. Site ve `/ws` aynı alan adından sunulur.

Bu sürüm odaları tek sunucunun belleğinde tutar. Bir kopya/instance kullanın; sunucu yeniden başlarsa açık odalar kapanır. Kalıcı jeton/garaj verisi kullanıcının tarayıcısında kalır. Kalıcı hesap, eşleştirme ve çok sunuculu ölçekleme bu sürümün kapsamında değildir.

## Yarış ve bağlantı davranışı

- Fizik sunucuda 60 Hz, ortak durum gönderimi yaklaşık 20 Hz çalışır. İstemci yalnızca gaz/fren/direksiyon girdisi gönderir; konum ve kazanan gönderemez.
- İstemcide yerel tahmin/düzeltme ve uzaktaki araçlarda interpolasyon bulunur.
- Odalar en fazla dört oyunculudur. En az iki bağlı oyuncu ve herkesin hazır olması gerekir. Başlatma ve yeni karşılaşma yetkisi oda sahibindedir.
- Bağlantı kesilince girdiler frenlenir. Aynı sekme 30 saniye içinde bağlantısına dönebilir; bu süre sonrası bitirmemiş oyuncu yarışı tamamlayamamış sayılır. Yarışın üst sınırı 180 saniyedir.
- Her odanın parkuru, engelleri, başlangıcı ve bitiş sırası ortaktır. Oda kodunu yalnızca odaya davet etmek istediğiniz kişilerle paylaşın.
- Davetlerde oyuncu kimlik anahtarı bulunmaz. Yeniden bağlanma anahtarı sekmenin `sessionStorage` alanında tutulur ve diğer oyunculara gönderilmez.
- Bu arkadaş yarışı sürümünde sunucu araç özelliklerini kendi kataloğundan alır. Garaj bakiyesi tarayıcı yerelidir; sunucu hesabına bağlı rekabetçi ekonomi değildir.
