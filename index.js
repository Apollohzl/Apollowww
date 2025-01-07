import express from "express"
import cors from "cors"
import fs from "fs"
import path from "path"
import multer from "multer"
import { exec } from "child_process"
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { exec } = require('child_process');
const app = express();
app.use(express.json());
app.use(cors());
app.options("*", cors());

// app.all('*', (req, res, next) => {
//   if (req.path !== '/python-signin' 
//     && req.path !== '/python-signup' 
//     && req.path !== '/downmsg' 
//     && req.path !== '/readimages' 
//     && req.path !== '/readbackpicture' 
//     && req.path !== '/upload'
//     && req.path !== '/readimages'
//     && req.path !== '/readimages'
//     && req.path !== '/readimages'
//     && req.path !== '/readimages'
//     && req.path !== '/readimages'
//     && req.path !== '/readimages'
//     && req.path !== '/readimages') {

//     return res.status(404).sendFile(path.join(__dirname, 'public/404.html')); // Serve your custom 404 page
//   }
//   next();
// });

// app.use((req, res) => {
//   res.status(404).sendFile(path.join(__dirname, 'public/404.html')); // Serve custom 404 page for other routes
// });

app.post('./python-signup', (req, res) => {
  const { input_uname, input_password } = req.body;
  exec(`python f:/py/Node登录系统/setup.py "${input_uname}" "${input_password}"`, (error, stdout, stderr) => {
    console.log(`有用户提交信息：`);
    const now = new Date();
    console.log(now); 
    console.log(`name: ${input_uname}`);
    console.log(`password: ${input_password}`);
    console.log(`===================================`);
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).send(`Python报错, 请联系管理员 \n${error}`);
    } 
    res.send(stdout);
  });
});

app.post('/python-signin', (req, res) => {
  const { name, passworda, passwordb, nameb } = req.body;
  exec(`python f:/py/Node登录系统/signup.py "${name}" "${passworda}" "${passwordb}" "${nameb}"`, (error, stdout, stderr) => {
    console.log(`python f:/py/Node登录系统/signup.py "${name}" "${passworda}" "${passwordb}"`);
    console.log(`有用户注册信息：`);
    const now = new Date();
    console.log(now); 
    console.log(`name: ${name}`);
    console.log(`passworda: ${passworda}`);
    console.log(`passwordb: ${passwordb}`);
    console.log(`昵称: ${nameb}`)
    console.log(`===================================`);
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).send(`Python报错, 请联系管理员 \n${error}`);
    } 
    res.send(stdout);
  });
});

app.post('/downmsg', (req, res) => {
  const {msg} = req.body;
  exec(`python f:/py/Node登录系统/get_sentences.py "${msg}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).send(`Python报错, 请联系管理员 \n${error}`);
    } 
    res.send(stdout);
  });
});

app.get('/readimages', (req, res) => {
  const directoryPath = path.join(__dirname, 'public', 'picture', 'zuowen');
  console.log('目录路径:', directoryPath); 
  fs.readdir(directoryPath, (err, files) => {
        if (err) {
          console.error('读取目录时出错:', err.message);
          return res.status(500).send('无法读取目录');
      }
      const images = files.filter(file => {
          return file.endsWith('.jpg') || file.endsWith('.png');
      }).map(file => path.join('/picture/zuowen', file));

      res.json(images);
  });
});

app.get('/readbackpicture', (req, res) => {
  const directoryPath = path.join(__dirname, 'public', 'picture', 'backpicture');
  console.log('目录路径:', directoryPath); 
  fs.readdir(directoryPath, (err, files) => {
        if (err) {
          console.error('读取目录时出错:', err.message);
          return res.status(500).send('无法读取目录');
      }
      console.log('backpicture文件列表:', files); 

      const images = files.filter(file => {
          return file.endsWith('.jpg') || file.endsWith('.png');
      }).map(file => path.join('/picture/backpicture', file));

      res.json(images);
  });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, 'public/picture/tupian'); 
  },
  filename: (req, file, cb) => {
      cb(null, getFilenameOfTime() + path.extname(file.originalname)); 
  }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
      return res.status(400).send({ message: '没有文件被上传' });
  }
  console.log("已下载一张照片，已保存");
  res.send({ message: '文件上传成功', file: req.file });
});

function getFilenameOfTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
}

// 启动服务器
app.listen(3008, () => {
  console.log(`Server is running at http://127.0.0.0:${port}`);
});
