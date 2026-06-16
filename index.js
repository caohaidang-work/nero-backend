const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config(); // Dùng để đọc file .env

const app = express();
app.use(express.json());

// KẾT NỐI MONGODB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Đã kết nối thành công với MongoDB Atlas!'))
    .catch((err) => console.error('Lỗi kết nối MongoDB:', err));

// Route kiểm tra
app.get('/', (req, res) => {
    res.send('Spotify Backend & MongoDB đang hoạt động mượt mà!');
});

// Route Cronjob (Sẽ viết logic ở bước sau)
app.get('/api/sync-spotify', async(req, res) => {
    try {
        console.log('Cronjob bắt đầu chạy...');
        // Code thu thập Spotify sẽ nằm ở đây
        res.status(200).json({ message: 'Đồng bộ Spotify thành công!' });
    } catch (error) {
        res.status(500).json({ error: 'Đồng bộ thất bại' });
    }
});

if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server chạy ở cổng ${PORT}`));
}

module.exports = app;