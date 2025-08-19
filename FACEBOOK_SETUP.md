# إعداد Facebook App لحل مشكلة HTTPS

## المشكلة
Facebook يرفض التطبيق لأنه يعمل على `http://localhost` (غير آمن).

## الحلول

### الحل الأول: إضافة localhost في Facebook App (الأسهل)

1. اذهب إلى [Facebook Developers](https://developers.facebook.com/)
2. اختر تطبيقك `ugu`
3. اذهب إلى **Settings > Basic**
4. في **App Domains** أضف:
   ```
   localhost
   ```
5. اذهب إلى **Facebook Login > Settings**
6. في **Valid OAuth Redirect URIs** أضف:
   ```
   http://localhost:3000
   http://localhost:3000/
   ```
7. في **Allowed Domains for the JavaScript SDK** أضف:
   ```
   localhost
   ```

### الحل الثاني: استخدام HTTPS محلي

1. قم بتثبيت `mkcert`:
   ```bash
   brew install mkcert
   mkcert -install
   mkcert localhost
   ```

2. أنشئ ملف `server-https.js`:
   ```javascript
   const https = require('https');
   const fs = require('fs');
   const express = require('express');
   
   const app = express();
   
   const options = {
     key: fs.readFileSync('localhost-key.pem'),
     cert: fs.readFileSync('localhost.pem')
   };
   
   https.createServer(options, app).listen(3000, () => {
     console.log('HTTPS Server running on port 3000');
   });
   ```

3. شغل الخادم:
   ```bash
   node server-https.js
   ```

4. استخدم: `https://localhost:3000`

### الحل الثالث: تعديل إعدادات Facebook App

1. في **Facebook Login > Settings**
2. **Disable HTTPS requirement** (للتطوير فقط)
3. **Add localhost to allowed domains**

## ملاحظات مهمة

- **للتطوير:** استخدم الحل الأول (إضافة localhost)
- **للإنتاج:** استخدم HTTPS دائماً
- **Facebook App Review:** قد تحتاج مراجعة للحصول على صلاحيات إضافية

## اختبار الحل

بعد تطبيق الحل:
1. أعد تشغيل الخادم
2. اذهب إلى `http://localhost:3000/login`
3. اضغط على زر تسجيل الدخول
4. يجب أن يعمل Facebook Login بدون أخطاء
