FROM node:20-slim

# تثبيت المتصفح والمكتبات اللازمة
RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# إعداد مجلد العمل
WORKDIR /usr/src/app

# نسخ الملفات
COPY package*.json ./
RUN npm install
COPY . .

# تشغيل البوت
CMD [ "node", "index.js" ]