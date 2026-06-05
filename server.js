import express from 'express';
const app = express();
const port = 3000;

// กำหนด route สำหรับหน้าแรก
app.get('/', (req, res) => {
  res.send('Hello from Express!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
