const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('🤖 MIRO BOT IS RUNNING 24/7!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// مفتاحك
const API_KEY = "AIzaSyDVqZUjV8YGdRSrvyCfjJrRuz21pm6JDNc"; 
const genAI = new GoogleGenerativeAI(API_KEY);

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { 
        args: ['--no-sandbox'],
    }
});

client.on('qr', (qr) => {
    console.log('⚡ كود QR:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ MIRO Bot Online (النسخة النهائية - قراءة الصور مفعلة)');
});

// دالة مساعدة لتحويل الصورة إلى صيغة مناسبة لـ Gemini
function imageToGenerativePart(data, mimeType) {
  return {
    inlineData: {
      data: data,
      mimeType
    },
  };
}

client.on('message_create', async msg => {
    
    const body = msg.body.toLowerCase();
    
    // تعريف أمر النص/الصور
    const isCommand = body.startsWith('@miro ') || body.startsWith('.miro ');
    
    // 1️⃣ للصور والنص (Multimodal)
    if (isCommand) {
        
        let userMessage = msg.body.slice(msg.body.indexOf(' ')).trim(); // استخراج النص بعد الأمر
        let promptParts = [];
        
        console.log(`📝 طلب: ${userMessage}`);

        // 👇👇 فلتر حقوق الملكية (MIRO MAN) 👇👇
        const keywords = [
            'من صنعك', 'من طورك', 'من برمجك', 'من قام بانشائك', 'من انشاك', 
            'شكون صايبك', 'شكون قادك', 'من صممك', 'من هو مطورك', 'من المطور',
            'من انت', 'عرف بنفسك', 'who made you', 'who created you'
        ];

        if (keywords.some(keyword => userMessage.includes(keyword))) {
            await msg.reply(`🤖 **MIRO MAN** هو من قام بصنعي وبرمجتي.\n\n💻 هو طالب مهووس بالبرمجة ولديه عدة مشاريع.\n\n🔗 للتعرف على المزيد حوله يمكنك زيارة صفحته على الانستغرام:\nhttps://instagram.com/miro.man.29`);
            return; 
        }
        // 👆👆 نهاية كود الحقوق 👆👆
        
        // 🛠️ التعامل مع الصور المرفقة في الرسالة (إذا وجدت)
        if (msg.hasMedia && msg.type === 'image') {
            try {
                const media = await msg.downloadMedia();
                if (media.data) {
                    promptParts.push(imageToGenerativePart(media.data, media.mimetype));
                }
            } catch (error) {
                console.error("❌ فشل تحميل صورة الرسالة:", error.message);
                msg.reply("⚠️ حدث خطأ أثناء محاولة قراءة الصورة المرفقة.");
            }
        }
        
        // إضافة النص بعد إضافة أي صور
        if (userMessage.length > 0) {
            promptParts.push(userMessage);
        }
        
        // التأكد من وجود محتوى للرد
        if (promptParts.length === 0) {
            msg.reply("👋 المرجو إرسال أمر أو صورة بتعليق (Caption) مناسب.\n\nمثال: `@miro لخص هذا النص`");
            return;
        }

        try {
            // الموديل السريع المتعدد الوسائط (Multimodal)
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            
            const result = await model.generateContent(promptParts);
            const text = result.response.text();
            msg.reply(text);
        
        } catch (error) {
            console.error("❌ خطأ Gemini:", error.message);
            if (error.message.includes('503')) {
                 msg.reply("⚠️ السيرفر مشغول قليلاً، أعد إرسال الرسالة فوراً.");
            } else {
                 msg.reply("⚠️ خطأ في معالجة طلبك: " + error.message);
            }
        }
    } 

    // 2️⃣ للصور (Image Generation) - كما في الكود القديم
    else if (body.startsWith('@miro+art ') || body.startsWith('.miro+art ')) {
        
        const prompt = msg.body.slice(10);
        console.log(`🎨 طلب صورة: ${prompt}`);
        
        const encodedPrompt = encodeURIComponent(prompt);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}`;

        try {
            const media = await MessageMedia.fromUrl(imageUrl, { unsafeMime: true });
            await client.sendMessage(msg.from, media, { caption: `🎨 ${prompt}` });

        } catch (error) {
            console.error("❌ فشل تحميل الصورة:", error.message);
            msg.reply(`⚠️ النت ضعيف لتحميل الصورة، لكن ها هو الرابط:\n${imageUrl}`);
        }
    }
});

client.initialize();