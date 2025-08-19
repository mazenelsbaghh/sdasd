# إعداد Facebook App لحل مشكلة JavaScript SDK

## المشكلة
```
لم يتم تبديل خيار JSSDK
يجب تبديل الخيار "تسجيل الدخول باستخدام JavaScript SDK" إلى "نعم" في developers.facebook.com لاستخدام JSSDK لتسجيل الدخول.
```

## الحل: تفعيل JavaScript SDK في Facebook App

### الخطوة 1: الذهاب إلى Facebook Developers
1. اذهب إلى [developers.facebook.com](https://developers.facebook.com/)
2. سجل الدخول بحسابك
3. اختر تطبيقك `ugu`

### الخطوة 2: تفعيل Facebook Login
1. في القائمة الجانبية، اختر **Facebook Login**
2. اضغط على **Get Started** أو **Set Up**
3. اختر **Web** كمنصة

### الخطوة 3: إعدادات JavaScript SDK
1. في **Facebook Login > Settings**
2. ابحث عن **Client OAuth Settings**
3. تأكد من تفعيل:
   - ✅ **Client OAuth Login** = **Yes**
   - ✅ **Web OAuth Login** = **Yes**
   - ✅ **Use Strict Mode for Redirect URIs** = **No** (للتطوير)

### الخطوة 4: إضافة Domains
1. في **App Domains** أضف:
   ```
   localhost
   ```

2. في **Valid OAuth Redirect URIs** أضف:
   ```
   https://localhost:3000
   https://localhost:3000/
   https://localhost:3000/login
   https://localhost:3000/auth/callback
   ```

3. في **Allowed Domains for the JavaScript SDK** أضف:
   ```
   localhost
   ```

### الخطوة 5: تفعيل JavaScript SDK
1. في **Facebook Login > Settings**
2. ابحث عن **JavaScript SDK**
3. تأكد من تفعيل:
   - ✅ **Login with the JavaScript SDK** = **Yes**
   - ✅ **Use Strict Mode for Redirect URIs** = **No**

### الخطوة 6: إعدادات إضافية
1. في **App Settings > Basic**
2. تأكد من:
   - **App ID** = `655413053660463`
   - **App Secret** موجود
   - **Privacy Policy URL** (اختياري)

### الخطوة 7: اختبار الإعداد
1. أعد تشغيل الخادم:
   ```bash
   npm run start:https
   ```

2. اذهب إلى: `https://localhost:3000/login`

3. اضغط على زر تسجيل الدخول

4. يجب أن يعمل Facebook Login بدون أخطاء

## ملاحظات مهمة

### للتطوير المحلي:
- استخدم `https://localhost:3000` دائماً
- لا تستخدم `http://localhost:3000`
- **Use Strict Mode** = **No** (للتطوير فقط)

### للإنتاج:
- استخدم HTTPS دائماً
- **Use Strict Mode** = **Yes**
- أضف domain الإنتاج في الإعدادات

### إذا لم يعمل:
1. تحقق من Console في المتصفح
2. تأكد من أن Facebook App ID صحيح
3. تأكد من تفعيل JavaScript SDK
4. تأكد من إضافة localhost في Domains

## روابط مفيدة
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)
- [JavaScript SDK Setup](https://developers.facebook.com/docs/javascript/quickstart)
- [App Review Process](https://developers.facebook.com/docs/app-review)

## اختبار نهائي
بعد تطبيق كل الإعدادات:
1. اذهب إلى `https://localhost:3000/login`
2. اضغط على زر تسجيل الدخول
3. يجب أن يفتح Facebook Login Dialog
4. سجل الدخول وأعط الأذن للتطبيق
5. سيتم توجيهك للتطبيق الرئيسي
