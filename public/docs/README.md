# README

Refer to the main project README for usage and setup instructions.
## Flow Aplikasi

1. **Upload Gambar**
	- User mengunggah gambar melalui komponen ImageUploader.
	- Gambar diproses menjadi data grid pixel oleh useImageProcessor.

2. **Proses Data Grid**
	- Data grid (gridData, imageData) diubah ke array RGBA.
	- Data RGBA ditampilkan dalam SimpleTableGrid dan RGBATable.

3. **Edit Pixel & Warna**
	- User memilih pixel dan mengubah warna menggunakan ColorPicker.
	- Info pixel ditampilkan secara real-time.
	- Semua perubahan dikelola oleh AppContext dan reducer.

4. **Rendering & Optimasi**
	- Grid dirender dengan Canvas API atau tabel sederhana untuk performa tinggi.
	- Virtualisasi viewport dan CSS digunakan untuk responsivitas.
	- Error handling dan loading state menjaga UX tetap baik.

5. **Ekspor Data**
	- User dapat mengekspor data grid ke CSV/JSON melalui RGBATable.
	- Semua proses ekspor dilakukan di client-side.

6. **Kesimpulan Flow**
	- User upload gambar → gambar diproses ke grid pixel → grid & data RGBA ditampilkan → user edit pixel/warna → perubahan dikelola context → user ekspor data.
	- Semua interaksi terjadi di frontend React, dengan state global dan komponen modular.: