const express = require('express');
const app = express();

app.use(express.json());

// Route 1: Trang chủ để kiểm tra server có sống không
app.get('/', (req, res) => {
    res.send('nero backend');
});

// Route 2: Đây là nơi Vercel Cronjob sẽ tự động gọi mỗi 2 tiếng
app.get('/api/sync-spotify', async(req, res) => {
    try {
        console.log('Cronjob đang chạy để đồng bộ nhạc...');

        // TODO: Logic dùng Refresh Token lấy Access Token mới
        // TODO: Gọi API lấy 50 bài hát gần nhất
        // TODO: Lưu vào cơ sở dữ liệu MongoDB Atlas

        res.status(200).json({ message: 'Đồng bộ Spotify thành công!' });
    } catch (error) {
        console.error('Lỗi khi đồng bộ:', error);
        res.status(500).json({ error: 'Đồng bộ thất bại' });
    }
});

// Quan trọng: Chỉ dùng app.listen khi chạy ở máy tính cá nhân (local)
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server đang chạy thử nghiệm ở cổng ${PORT}`);
    });
}

// BẮT BUỘC: Phải export app ra thì Vercel Serverless mới hiểu và chạy được
module.exports = app;