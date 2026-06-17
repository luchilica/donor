import * as nodemailer from 'nodemailer';
import * as OneSignal from 'onesignal-node';
import { Donor } from '../src/types.js';

let transporter: nodemailer.Transporter | null = null;
let oneSignalClient: OneSignal.Client | null = null;

function getTransporter(): nodemailer.Transporter | null {
    if (!transporter && process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
        // Automatically determine host/port based on common providers, or allow them to be customized if needed.
        // For Gmail, we can use the 'gmail' service shortcut.
        const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465;
        const isSecure = smtpPort === 465;
        transporter = nodemailer.createTransport({
            service: process.env.SMTP_EMAIL.includes('@gmail.com') ? 'gmail' : undefined,
            host: process.env.SMTP_HOST || (process.env.SMTP_EMAIL.includes('@yandex') ? 'smtp.yandex.ru' : process.env.SMTP_EMAIL.includes('@mail.ru') ? 'smtp.mail.ru' : undefined),
            port: smtpPort,
            secure: isSecure,
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD
            }
        });
    }
    return transporter;
}

function getOneSignal(): OneSignal.Client | null {
    if (!oneSignalClient && process.env.ONESIGNAL_REST_API_KEY && process.env.VITE_ONESIGNAL_APP_ID) {
        oneSignalClient = new OneSignal.Client(process.env.VITE_ONESIGNAL_APP_ID, process.env.ONESIGNAL_REST_API_KEY);
    }
    return oneSignalClient;
}

export async function sendPushNotification(playerIds: string[], messageText: string) {
    const client = getOneSignal();
    if (!client || playerIds.length === 0) return;

    try {
        const notification = {
            contents: {
                'en': messageText,
                'ru': messageText,
            },
            headings: {
                'en': 'Донор-Алерт: требуется кровь',
                'ru': 'Донор-Алерт: требуется кровь',
            },
            include_player_ids: playerIds,
        };
        await client.createNotification(notification);
    } catch (e) {
        console.error('Push notification error:', e);
    }
}

export async function sendEmailNotification(emails: string[], messageText: string, centerPhone: string) {
    const transporter = getTransporter();
    if (!transporter || emails.length === 0) return;

    const htmlContent = `
        <div style="font-family: sans-serif; padding: 20px;">
            <h2>Донор-Алерт: требуется кровь</h2>
            <p>${messageText}</p>
            <p><strong>Контактный телефон центра:</strong> ${centerPhone || 'Не указан'}</p>
            <a href="https://donor-by.vercel.app" style="display: inline-block; padding: 10px 20px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 5px;">Перейти в кабинет</a>
            <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">
                Вы получили это письмо, потому что подписаны на уведомления Донор-Алерт.<br/>
                <a href="https://donor-by.vercel.app/profile">Отписаться от рассылки</a>
            </p>
        </div>
    `;

    try {
        const info = await transporter.sendMail({
            from: `"Donor-Alert" <${process.env.SMTP_EMAIL}>`,
            bcc: emails,
            subject: 'Донор-Алерт: требуется кровь',
            html: htmlContent,
        });
        console.log(`[Nodemailer] Successfully sent mass email to ${emails.length} recipients:`, info.messageId);
    } catch (e: any) {
        console.error('[Nodemailer] ERROR sending mass email:', e.message || e);
    }
}

export async function sendTransactionalEmail(to: string, type: 'welcome' | 'center_added' | 'reset' | 'confirmed' | 'rejected', extra?: any) {
    const transporter = getTransporter();
    if (!transporter) return;

    let subject = '';
    let htmlContent = '';

    if (type === 'welcome') {
        subject = 'Добро пожаловать в Донор-Алерт';
        htmlContent = `
            <h2>Спасибо за регистрацию!</h2>
            <p>Вы успешно зарегистрировались в приложении Донор-Алерт. В ближайшее время выбранный центр крови подтвердит вашу заявку.</p>
            <a href="https://donor-by.vercel.app">Авторизоваться</a>
        `;
    } else if (type === 'center_added') {
        subject = 'Вы добавлены в Донор-Алерт';
        htmlContent = `
            <h2>Вас добавили в Донор-Алерт</h2>
            <p>Центр крови создал для вас учетную запись.</p>
            <p><strong>Ваш логин:</strong> ${extra?.email}</p>
            <p><strong>Ваш пароль:</strong> ${extra?.password}</p>
            <a href="https://donor-by.vercel.app">Войти в кабинет</a>
            <p><small>Пожалуйста, смените пароль после первого входа!</small></p>
        `;
    } else if (type === 'reset') {
        subject = 'Сброс пароля';
        htmlContent = `
            <h2>Сброс пароля</h2>
            <p>Ваш код для сброса пароля: <strong>${extra?.code}</strong></p>
            <p>Или перейдите по ссылке (действительна 1 час):</p>
            <a href="https://donor-by.vercel.app/reset-password?code=${extra?.code}&email=${extra?.email}">Сбросить пароль</a>
        `;
    } else if (type === 'confirmed') {
        subject = 'Ваша заявка подтверждена';
        htmlContent = `
            <h2>Ваша заявка подтверждена!</h2>
            <p>Центр крови успешно подтвердил вашу заявку.</p>
            <a href="https://donor-by.vercel.app">Перейти в личный кабинет</a>
        `;
    } else if (type === 'rejected') {
        subject = 'Ваша заявка отклонена';
        htmlContent = `
            <h2>Ваша заявка на привязку к центру крови отклонена</h2>
            <p><strong>Причина:</strong> ${extra?.reason || 'Не указана'}</p>
            <p>Вы можете исправить данные в личном кабинете и отправить заявку повторно.</p>
            <a href="https://donor-by.vercel.app">Войти в кабинет</a>
        `;
    }

    try {
        const info = await transporter.sendMail({
            from: `"Donor-Alert" <${process.env.SMTP_EMAIL}>`,
            to,
            subject,
            html: htmlContent,
        });
        console.log(`[Nodemailer] Successfully sent ${type} email to ${to}:`, info.messageId);
    } catch (e: any) {
        console.error(`[Nodemailer] ERROR sending ${type} email to ${to}:`, e.message || e);
    }
}

export async function sendSmsNotification(phones: string[], messageText: string) {
    if (phones.length === 0) return;
    const text = messageText.substring(0, 160); // 160 chars max

    const apiKey = process.env.SMS_API_KEY;
    if (!apiKey) {
        console.log(`\n============== [SMS SIMULATOR / СМС-СИМУЛЯТОР] ==============`);
        console.log(`Статус: ИМИТАЦИЯ ОТПРАВКИ УСПЕШНА (API-ключ не задан в .env.example)`);
        console.log(`Отправитель: "Donor-Alert"`);
        console.log(`Получатели (${phones.length}): ${phones.join(', ')}`);
        console.log(`Сообщение: "${text}"`);
        console.log(`=============================================================\n`);
        return;
    }

    // Using a mock SMS provider approach as configured (SMSPILOT / Unisender)
    // We'll use a generic fetch that logs if testing, or sends if valid
    try {
        // SMSPILOT Example
        const url = `https://smspilot.ru/api.php?send=${encodeURIComponent(text)}&to=${phones.join(',')}&apikey=${apiKey}&format=json`;
        console.log(`[SMSPILOT] Sending to ${phones.join(',')} via real gateway...`);
        const response = await fetch(url);
        if (!response.ok) {
            console.error('SMS notification error, status:', response.status);
        } else {
            console.log('[SMSPILOT] API call completed.');
        }
    } catch (e) {
        console.error('SMS notification error:', e);
    }
}

export async function dispatchNotifications(
    donors: Donor[], 
    channel: string, 
    messageText: string, 
    centerPhone: string
) {
    // Non-blocking dispatch
    setImmediate(async () => {
        try {
            const pushPlayerIds: string[] = [];
            const emails: string[] = [];
            const phones: string[] = [];

            const needsPush = ['push', 'push_sms', 'all'].includes(channel);
            const needsSms = ['sms', 'push_sms', 'all'].includes(channel);
            const needsEmail = ['email', 'all'].includes(channel);

            for (const donor of donors) {
                if (needsPush && donor.pushEnabled && donor.onesignalPlayerId) {
                    pushPlayerIds.push(donor.onesignalPlayerId);
                }
                if (needsEmail && donor.emailNotificationsEnabled && donor.email) {
                    emails.push(donor.email);
                }
                if (needsSms && donor.smsEnabled && donor.phone) {
                    phones.push(donor.phone.replace(/\D/g, ''));
                }
            }

            const tasks = [];
            if (pushPlayerIds.length > 0) tasks.push(sendPushNotification(pushPlayerIds, messageText));
            if (emails.length > 0) tasks.push(sendEmailNotification(emails, messageText, centerPhone));
            if (phones.length > 0) tasks.push(sendSmsNotification(phones, messageText));

            await Promise.allSettled(tasks);
        } catch (e) {
            console.error('Dispatch notifications failed:', e);
        }
    });
}
