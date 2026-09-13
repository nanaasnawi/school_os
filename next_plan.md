1. "Smart" Reminder buat Guru (Anti-Spam)
Kasus: Guru rajin yang udah nyiapin materi/kuis dari semalem.
Solusi: Logic di backend Rust harus ngecek dulu. Kalau di sesi jam pelajaran itu database materinya masih kosong, baru tembak notif, contoh: "Jam pelajaran X MIPA 1 mulai 15 menit lagi, jangan lupa isi materi ya, Pak/Bu!". Tapi kalau udah diisi, ganti notifnya jadi konfirmasi kalem aja: "Materi Fisika X MIPA 1 akan otomatis ter-publish 15 menit lagi." Jadi guru ngerasa diapresiasi, bukan disuruh-suruh mulu.

2. Grouping & Debouncing buat Chat
Kasus: Siswa nanya ke guru tapi ngetiknya di-Enter per kata (kayak bocah WA pada umumnya) wkwkwk.

Solusi: Jangan pakai tombol keyboard enter buat kirim pesan. 

3. Deep Linking Wajib Hadir!
Karena Jetpack Compose udah rapi modularnya, pastiin pas siswa nge-klik notif contoh: "Tugas Fisika baru dari Pak Joko", aplikasinya langsung lompat (navigate) ke halaman detail tugas tersebut, bukan malah buka halaman Home. Ini ngurangin step dan bikin siswa gak ada alasan "lupa naruh tugasnya di mana".

4. Jangan Lupakan Sang "Ibu" (The Secret Weapon)
Nah, kemarin kan udah bikin arsitektur akun khusus Ibu (ibu_<nisn>). Ini saatnya diberdayakan!

Gak usah semua notif dikirim ke emaknya (nanti berisik). Cukup notif yang krusial aja. Misalnya: H-1 batas waktu tugas belum dikerjain, atau hasil nilai kuis baru aja keluar. Bayangin emaknya dapet notif: "Ibu, Budi belum mengerjakan Tugas Fisika yang tenggatnya jam 23.59 malam ini." Wah, kelar itu si Budi kena omelan emaknya wkwkwk. Tingkat kelulusan tugas dijamin meroket!

5. Quiet Hours (Jam Tenang)
Batasin cron job atau sistem antrean notif di Rust. Jangan sampai ada guru iseng upload tugas jam 2 pagi, terus HP 40 siswa bunyi barengan jam 2 pagi juga. Kasih aturan queue, misal: tugas yang di-post di atas jam 9 malam, notifnya baru dikirim jam 6 pagi.