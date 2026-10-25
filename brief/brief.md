please continue this project:

buatkan saya aplikasi web manajemen arsip, pastikan desainnya clean rapih, typography konsisten dan jangan terlalu banyak teks/kalimat yang tidak diperlukan, berikut tech stack yang saya inginkan [AGENTS.md]  , berikut chat saya dengan client :

Saya ada rencana mau buat aplikasi13:02
Rencananya mau buat aplikasi apa ka?
13:02
Aplikasi menyimpan data yang berbasis gmaps atau google earth13:04
Kemudian ada akun user dan admin.. Bisa menambahkan user..

data yg disimpan apa ka?13:11
Trus berbasis gmaps dan google earth itu maksudnya bagian apanya? Lokasi penyimpanannya atau gmna13:11
saya pernah buat aplikasi untuk laporan pelanggaran di laut, jdi ada titik koordinatnya muncul di maps

Jadi teknisnya
Admin menginput data dari suatu dokumen, pilihan inputannya seperti Nama, Tempat tinggal, Pekerjaan, dll. Kemudian tersedia juga menu upload hasil scan dokumen tsb..

Terhadap Dokumen tersebut dapat ditautkan lokasi, yg mana ada pilihan klik untuk melihat lokasi tsb

Contoh : misalkan sdh terinput tahun 2025

Pada home dapat berisi dashboard, kemudian ada pilihan tahun, ketika tahun 2025 dipilih, muncul halaman berupa tabel yg tersusun hasil dari inputan data 2025, kemudian Kita memilih salah satu data pada tabel tersebut, terbuka halaman lagi yang berisi informasi dari data tersebut..

Ketika kita log in sebagai admin itu terdapat menu tambahkan atau edit, sedangkan user tidak ada

berarti lokasi yang di input itu lokasi yang berdasarkan alamat nya ya

Misalkan dokumen yang mengacuh terhadap kejadian2 Pidana.. Dokumen pertama, tidak pidana yg dilakukan oleh si A.. Maka kita menginput semua identitas pelaku, korban, kronologis, riwayat, kemudian lokasi kejadian (lokasi ini yg tertaut dengan gmaps atau gearth)13:25
Agak mirip aplikasi avenza, tapi Avenza Kita menandai lokasi baru kemudian kita isi keterangan atau atributnya, tapi tidak online, mengupload citra satelit.. (mungkin pake leafletjs yang free gaperlu dalam bentuk satelit juga gpp, kalo untuk search alamatnya yang free juga bebas boleh pakai apapun)

jdi intinya untuk lokasi itu biasanya ada inputan lokasi alamat lengkapnya, nah itu nnti bisa di input ke maps/google earth biasanya ditandain jadi pin13:32
saya biasanya pakai maps seperti ini

Iya.. Tapi Fokusnya ini ke penyimpanan dokumen secara digital namun tertaut Lokasi.. Yang hanya bisa digunakan teman2 sekantor untuk keperluan pekerjaan..

[13.55, 20/10/2026] +62 823-9332-2200: Sy list dlu yah..
[13.55, 20/10/2026] Cecep: baik pak
[13.56, 20/10/2026] +62 823-9332-2200: trus dokumennya itu berarti bisa di upload ?
Iya.. Hasil scan dokumen
[13.57, 20/10/2026] Cecep: baik
[15.15, 20/10/2026] +62 823-9332-2200: Untuk pengimputan ada 2 Jenis : Sengketa dan Perkara

SENGKETA (daftar dibawah yg diinput)

I. No. Registrasi Kasus

II. Pihak Pengadu (ada pilihan : Perorangan/Pemerintah/Badan Hukum/Kelompok Masyarakat)

Kalau memilih "Perorangan" isinya :
NIK :
Nama :
Alamat :
Pekerjaan :

Kalau memilih "Badan Hukum" isinya :
Nama Badan Hukum :
Kedudukan :

Kalau memilih "Pemerintah" isinya :
Nama Instansi :
Kedudukan :

Kalau memilih "Kelompok Masyarakat" isinya :
Nama Kelompok/Perkumpulan :
Kedudukan :


III. Pihak Teradu (Pilihan dan isi sama dengan diatas)

IV. Objek
Dusun/Lingkungan :
Desa/Kelurahan :
Kecamatan :
Kabupaten :
Provinsi :
Location : Terhubung Gmaps

V. Riwayat Kasus
A. Akar Masalah
B. Pokok Masalah
C. Tipologi Kasus (ada pilihan) :
letak dan batas bidang tanah; penguasaan dan pemilikan; 
penggunaan dan pemanfaatan tanah;
penetapan hak dan pendaftaran tanah;
pemeliharaan data pendaftaran tanah;
tanah objek land reform;
tanah adat/tanah ulayat;
pengadaan tanah;
pelaksanaan putusan pengadilan;
informasi dan transaksi elektronik terkait pelayanan pertanahan;
tipologi lainnya.
D. Klasifikasi Kasus : (ada pilihan Ringan, Sedang, Berat)

VI. TINDAK LANJUT : 
A. Bentuk Penanganan : (Ada Opsi Pilihan, Surat Rekomendasi, Mediasi, Surat Balasan)
B. Status : (Ada Opsi Pilihan, Tidak Ada Penyelesaian, Damai/Sepakat, Sementara Penanganan, Dalam proses perkara)
[15.16, 20/10/2026] +62 823-9332-2200: Tinggal yang menu PERKARA

[16.47, 20/10/2026] +62 823-9332-2200: Sy susun lg buat perkara..
[16.47, 20/10/2026] Cecep: Siap
[01.26, 21/10/2026] +62 823-9332-2200: PERKARA

I. No. Perkara : ...... Pengadilan : (Dapat memilih : Pengadilan Negeri atau Pengadilan Tata Usaha Negara)

II. Pihak Penggugat (dapat lebih dari 1)
NIK :
Nama :
Alamat :
Pekerjaan :

III. Pihak Tergugat (dapat lebih dari 1)
NIK :
Nama :
Alamat :
Pekerjaan :

IV. Pihak Turut Tergugat (dapat lebih dari 1)
NIK :
Nama :
Alamat :
Pekerjaan :

V. Objek Perkara
Dusun/Lingkungan :
Desa/Kelurahan :
Kecamatan :
Kabupaten :
Provinsi :
Location : Terhubung Gmaps

VI. Status Perkara (dapat memilih : Inkrah atau Sementara Berjalan atau Upaya Hukum

VI. Riwayat Perkara
A. Tingkat Pertama :
Nomor :
Amar Putusan :
B. Tingkat Banding :
Nomor :
Amar Putusan :
C. Tingkat Kasasi
Nomor :
Amar Putusan :
D. Peninjauan Kembali
Nomor :
Amar Putusan :
E. Berita Acara Eksekusi
Nomor :

VII. Pemenang Perkara (Dapat memlih Pihak Penggugat atau Tergugat, otomatis muncul Datanya sesuai dengan Point I atau II)

nama aplikasinya KASTA
berikut flow dari client :
[KASTA.pdf]
