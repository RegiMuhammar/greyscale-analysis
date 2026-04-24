# Analysis Workflow

Dokumen ini menjelaskan proses yang terjadi di balik layar saat aplikasi melakukan konversi dan analisis greyscale pada dua foto sampel kain: foto sebelum pencucian dan foto sesudah pencucian.

## 1. Input Foto

User mengunggah dua gambar:

- Foto sebelum pencucian.
- Foto sesudah pencucian.

Validasi awal dilakukan di browser:

- Format yang diterima: JPG, PNG, WEBP.
- Ukuran maksimum: 10MB per file.
- File tidak dikirim ke server.

Setelah valid, file dibaca sebagai object URL agar bisa dimuat ke elemen `Image` dan diproses memakai Canvas API.

## 2. Konversi Greyscale

Setiap foto dikonversi menjadi gambar greyscale dengan rumus luminosity:

```text
gray = 0.299R + 0.587G + 0.114B
```

Nilai `gray` tersebut kemudian dipakai untuk mengganti tiga channel warna:

```text
R = gray
G = gray
B = gray
```

Rumus ini lebih representatif dibanding rata-rata sederhana `(R + G + B) / 3` karena mata manusia lebih sensitif terhadap hijau, lalu merah, lalu biru.

Output tahap ini:

- Before original.
- Before greyscale.
- After original.
- After greyscale.

## 3. Sampling Data Warna

Untuk analisis numerik, aplikasi tidak membaca gambar pada resolusi penuh jika gambar terlalu besar. Foto diskalakan ke maksimum 240px pada sisi terpanjang.

Tujuannya:

- Analisis tetap cepat di browser.
- Beban memori lebih rendah.
- Nilai rata-rata tetap cukup stabil untuk estimasi visual MVP.

Untuk setiap pixel hasil sampling, aplikasi membaca:

```text
R, G, B, Alpha
```

Alpha tidak digunakan dalam perhitungan metrik warna saat ini.

## 4. Average RGB

Aplikasi menghitung rata-rata channel merah, hijau, dan biru dari semua pixel sampel.

```text
averageR = totalR / jumlahPixel
averageG = totalG / jumlahPixel
averageB = totalB / jumlahPixel
```

Hasil ini dipakai untuk:

- Membuat swatch warna rata-rata sebelum dan sesudah.
- Membandingkan perubahan channel RGB.
- Menjadi input konversi ke LAB.
- Menjadi data chart Radar RGB.

Delta RGB dihitung sebagai:

```text
deltaR = afterR - beforeR
deltaG = afterG - beforeG
deltaB = afterB - beforeB
```

Interpretasi:

- Nilai positif berarti channel tersebut naik setelah pencucian.
- Nilai negatif berarti channel tersebut turun setelah pencucian.
- Channel dengan nilai absolut terbesar dianggap sebagai channel yang paling berubah.

## 5. Value / Luminosity

Selain RGB, aplikasi menghitung nilai terang-gelap atau value memakai rumus luminosity yang sama:

```text
value = 0.299R + 0.587G + 0.114B
```

Rata-rata value dihitung untuk foto sebelum dan sesudah:

```text
beforeValue = totalBeforeValue / jumlahPixel
afterValue = totalAfterValue / jumlahPixel
deltaValue = afterValue - beforeValue
```

Persentase perubahan value:

```text
valueChangePercent = deltaValue / beforeValue * 100
```

Interpretasi:

- `deltaValue > 0`: sampel cenderung lebih terang atau pudar.
- `deltaValue < 0`: sampel cenderung lebih gelap.
- Perubahan kecil mendekati 0 berarti terang-gelap relatif stabil.

## 6. Konversi RGB ke CIE LAB

Aplikasi mengonversi average RGB ke CIE LAB.

Tahap konversinya:

1. sRGB dinormalisasi dari 0-255 menjadi 0-1.
2. sRGB dikonversi ke linear RGB.
3. Linear RGB dikonversi ke XYZ dengan matriks D65.
4. XYZ dikonversi ke LAB memakai white point:
   - Xn = 95.047
   - Yn = 100
   - Zn = 108.883

Makna LAB:

- `L*`: terang-gelap.
- `a*`: arah hijau ke merah.
- `b*`: arah biru ke kuning.

Delta LAB dihitung sebagai:

```text
deltaL = afterL - beforeL
deltaA = afterA - beforeA
deltaB = afterB - beforeB
```

Interpretasi:

- `deltaL > 0`: lebih terang.
- `deltaL < 0`: lebih gelap.
- `deltaA > 0`: arah merah meningkat.
- `deltaA < 0`: arah hijau meningkat atau merah berkurang.
- `deltaB > 0`: arah kuning meningkat.
- `deltaB < 0`: arah biru meningkat atau kuning berkurang.

## 7. Delta E CIE76

Delta E digunakan sebagai estimasi jarak perubahan warna antara average LAB sebelum dan sesudah.

Rumus yang digunakan adalah CIE76:

```text
DeltaE = sqrt((deltaL)^2 + (deltaA)^2 + (deltaB)^2)
```

Semakin besar Delta E, semakin besar estimasi perubahan warna.

Catatan penting:

- Ini adalah estimasi berbasis foto.
- Hasil sangat dipengaruhi pencahayaan, white balance, kamera, bayangan, dan kondisi sampel.
- Ini belum setara dengan pengukuran laboratorium memakai spektrofotometer atau prosedur ISO resmi.

## 8. Estimasi Grade Greyscale

Delta E dipetakan ke estimasi grade visual.

| Delta E CIE76 | Estimasi Grade | Interpretasi |
| --- | --- | --- |
| `<= 0.8` | 5 | Tidak ada perubahan warna |
| `<= 1.7` | 4-5 | Perubahan sangat kecil |
| `<= 2.5` | 4 | Perubahan kecil |
| `<= 3.4` | 3-4 | Perubahan cukup kecil |
| `<= 6.8` | 3 | Perubahan sedang |
| `<= 9` | 2-3 | Perubahan cukup besar |
| `<= 12` | 2 | Perubahan besar |
| `<= 16` | 1-2 | Perubahan sangat besar |
| `> 16` | 1 | Perubahan ekstrem |

Grade ini ditampilkan sebagai estimasi awal. Observer tetap perlu membandingkan visual dengan referensi greyscale ISO dan memberikan grade manual jika dibutuhkan.

## 9. Histogram

Aplikasi membuat histogram dengan 32 bin untuk:

- Red.
- Green.
- Blue.
- Value/luminosity.

Setiap pixel dimasukkan ke bin berdasarkan nilai channel 0-255:

```text
bin = floor((nilai / 256) * 32)
```

Histogram dipakai untuk melihat distribusi tonal:

- Apakah foto lebih banyak di area gelap, tengah, atau terang.
- Apakah sesudah pencucian distribusi bergeser ke kanan atau kiri.
- Apakah channel RGB tertentu berubah lebih dominan.

Mode chart:

- `Value`: membandingkan distribusi terang-gelap sebelum dan sesudah.
- `RGB`: membandingkan distribusi masing-masing channel warna.

## 10. Radar RGB

Radar RGB menampilkan kekuatan rata-rata channel:

- R
- G
- B

Ada dua polygon:

- Sebelum.
- Sesudah.

Tujuannya agar perubahan komposisi warna dapat dilihat cepat, bukan hanya sebagai angka. Jika salah satu sudut radar melebar atau mengecil, channel tersebut berubah relatif terhadap yang lain.

## 11. Change Matrix

Change matrix adalah peta perubahan lokal berbentuk grid 18x18.

Prosesnya:

1. Foto sebelum dan sesudah masing-masing diperkecil ke ukuran 18x18.
2. Setiap cell mewakili satu area kecil pada foto.
3. Untuk tiap cell, aplikasi menghitung:
   - Jarak RGB.
   - Delta value/luminosity.
   - Intensitas perubahan gabungan.

Jarak RGB:

```text
rgbDistance = sqrt((deltaR)^2 + (deltaG)^2 + (deltaB)^2)
```

Normalisasi intensitas RGB:

```text
rgbIntensity = rgbDistance / 441.67 * 100
```

Angka `441.67` adalah jarak maksimum RGB 3D dari hitam ke putih:

```text
sqrt(255^2 + 255^2 + 255^2)
```

Intensitas final:

```text
intensity = rgbIntensity * 0.7 + abs(deltaValue / 255) * 100 * 0.3
```

Artinya:

- 70% bobot dari perubahan warna RGB.
- 30% bobot dari perubahan terang-gelap.

Warna cell matrix:

- Biru: area menjadi lebih terang.
- Oranye: area menjadi lebih gelap.
- Gelap/netral: perubahan warna tanpa arah value yang kuat.

Matrix juga menghitung:

- Rata-rata intensitas perubahan.
- Intensitas maksimum.
- Persentase area dengan perubahan tinggi.

Saat ini threshold area perubahan tinggi adalah:

```text
intensity >= 18
```

## 12. Numeric Report

Numeric report merangkum angka utama agar bisa dibaca atau dicatat:

- Before RGB.
- After RGB.
- Before value.
- After value.
- Before LAB.
- After LAB.
- Delta E CIE76.
- Estimated grade.

Bagian ini membantu user memahami perubahan sebagai data, bukan hanya melihat hasil greyscale.

## 13. Insight Otomatis

Aplikasi membuat insight singkat dari hasil analisis.

Insight terdiri dari:

- Ringkasan estimasi grade.
- Arah perubahan value.
- Channel RGB yang paling berubah.
- Arah perubahan LAB.

Contoh interpretasi:

```text
Estimasi grade 4-5 (Perubahan sangat kecil).
Sampel cenderung lebih terang atau pudar setelah pencucian.
Channel R paling berubah.
Arah kuning meningkat.
```

Insight ini bukan keputusan final, melainkan ringkasan pembacaan angka.

## 14. Reference Chart

Aplikasi menampilkan dua referensi visual:

- ISO greyscale visual reference.
- Color value reference.

Referensi ini digunakan untuk membantu observer melakukan validasi visual. Referensi di app bersifat ilustratif dan bukan pengganti alat kalibrasi resmi.

## 15. Fullscreen Analysis Canvas

Hasil analisis ditampilkan di `Analysis Greyscale`.

Mode normal menampilkan:

- Preview empat gambar utama.
- Metrik utama.
- Chart.
- Matrix.
- Numeric report.
- Referensi visual.

Mode expand/fullscreen membuka workspace yang lebih luas dan zoomable agar user bisa membaca detail chart, matrix, dan referensi dengan lebih nyaman.

## 16. Batasan MVP

Analisis saat ini sudah lebih dari sekadar filter hitam-putih, tetapi tetap punya batasan:

- Tidak ada kalibrasi kamera.
- Tidak ada white reference card.
- Tidak ada masking area kain otomatis.
- Background dan bayangan dapat mempengaruhi rata-rata warna.
- Delta E dihitung dari warna rata-rata, bukan dari seluruh distribusi warna LAB per pixel.
- Estimasi grade belum menggantikan penilaian observer terhadap greyscale fisik ISO 105-A03.

Untuk hasil yang lebih kuat pada fase berikutnya, fitur yang dapat ditambahkan:

- Crop/masking area kain.
- White balance manual berbasis reference patch.
- Analisis Delta E per area.
- Export PDF report.
- Penyimpanan riwayat sampel.
- Kalibrasi chart warna fisik.
