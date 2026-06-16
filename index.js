const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios'); // Thư viện dùng để gọi API (giống fetch)
require('dotenv').config();

const app = express();
app.use(express.json());

// 1. KẾT NỐI DATABASE
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Đã kết nối thành công với MongoDB Atlas!'))
    .catch((err) => console.error('Lỗi kết nối MongoDB:', err));

// 2. THIẾT KẾ CẤU TRÚC DỮ LIỆU BÀI HÁT (SCHEMA)
const trackSchema = new mongoose.Schema({
    played_at: { type: Date, required: true, unique: true }, // Mốc thời gian nghe (Dùng unique để chống lưu trùng lặp dữ liệu)
    track_id: String,
    name: String,
    artist: String,
    album_url: String,
    spotify_url: String
});
// Đảm bảo không bị lỗi đè Model khi Vercel khởi động lại
const Track = mongoose.models.Track || mongoose.model('Track', trackSchema);

app.get('/', (req, res) => {
    res.send('Hệ thống Spotify Backend & Database đang hoạt động 24/7!');
});

// 3. THUẬT TOÁN ĐỒNG BỘ DỮ LIỆU (Vercel sẽ tự động gọi hàm này mỗi 00:00)
app.get('/api/sync-spotify', async(req, res) => {
    try {
        console.log('Cronjob bắt đầu chạy...');

        // BƯỚC A: LẤY CHÌA KHÓA MỚI TỪ SPOTIFY
        // Vì máy chủ chạy ngầm không có người dùng bấm đăng nhập, nó phải dùng Refresh Token (Chìa khóa vĩnh cửu) để tự xin Access Token mới.
        const tokenResponse = await axios.post('https://accounts.spotify.com/api/token',
            new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: process.env.SPOTIFY_REFRESH_TOKEN,
                client_id: process.env.SPOTIFY_CLIENT_ID,
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')
                }
            }
        );
        const accessToken = tokenResponse.data.access_token;

        // BƯỚC B: GỌI API LẤY 50 BÀI HÁT GẦN NHẤT
        const spotifyRes = await axios.get('https://api.spotify.com/v1/me/player/recently-played?limit=50', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const items = spotifyRes.data.items;
        let addedCount = 0;

        // BƯỚC C: LƯU VÀO DATABASE KÈM BỘ LỌC TRÙNG LẶP
        for (let i = 0; i < items.length; i++) {
            const item = items[i];

            // Lệnh updateOne với upsert: true sẽ tìm xem mốc thời gian played_at đã tồn tại chưa.
            // Nếu có rồi -> Bỏ qua. Nếu chưa có -> Lưu bài hát mới vào Database.
            const result = await Track.updateOne({ played_at: new Date(item.played_at) }, {
                $set: {
                    track_id: item.track.id,
                    name: item.track.name,
                    artist: item.track.artists[0].name,
                    album_url: item.track.album.images[0].url,
                    spotify_url: item.track.external_urls.spotify
                }
            }, { upsert: true });

            if (result.upsertedCount > 0) {
                addedCount++;
            }
        }

        res.status(200).json({ message: `Đồng bộ hoàn tất! Đã cập nhật thành công ${addedCount} bài hát mới vào Database.` });
    } catch (error) {
        console.error('Lỗi khi đồng bộ:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Đồng bộ thất bại, hãy kiểm tra lại Token' });
    }
});

// Lệnh khởi động Server khi code trên máy tính
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server Backend đang chạy ở cổng ${PORT}`));
}

module.exports = app;