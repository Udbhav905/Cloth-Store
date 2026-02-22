import dotenv from 'dotenv';
dotenv.config();

import { configDotenv } from 'dotenv';
import e from 'express'
const app = e();

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

const PORT=process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
