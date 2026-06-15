import { Resend } from 'resend';
import * as OneSignal from 'onesignal-node';
import { Donor } from '../src/types.js';

let resendClient: Resend | null = null;
let oneSignalClient: OneSignal.Client | null = null;

function getResend(): Resend | null {
    if (!resendClient && process.env.RESEND_API_KEY) {
        resendClient = new Resend(process.env.RESEND_API_KEY);
    }
    return resendClient;
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
    const resend = getResend();
    if (!resend || emails.length === 0) return;

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
        const result = await resend.emails.send({
            from: 'Donor-Alert <noreply@resend.dev>', // Needs a verified domain in real life
            to: emails,
            subject: 'Донор-Алерт: требуется кровь',
            html: htmlContent,
        });
        console.log(`[Resend] Successfully sent mass email to ${emails.length} recipients:`, result.data?.id);
    } catch (e: any) {
        console.error('[Resend] ERROR sending mass email:', e.message || e);
    }
}

export async function sendTransactionalEmail(to: string, type: 'welcome' | 'center_added' | 'reset', extra?: any) {
    const resend = getResend();
    if (!resend) return;

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
    }

    try {
        const result = await resend.emails.send({
            from: 'Donor-Alert <noreply@resend.dev>',
            to,
            subject,
            html: htmlContent,
        });
        console.log(`[Resend] Successfully sent ${type} email to ${to}:`, result.data?.id);
    } catch (e: any) {
        console.error(`[Resend] ERROR sending ${type} email to ${to}:`, e.message || e);
    }
}

export async function sendSmsNotification(phones: string[], messageText: string) {
    const apiKey = process.env.SMS_API_KEY;
    if (!apiKey || phones.length === 0) return;

    // Using a mock SMS provider approach as configured (SMSPILOT / Unisender)
    // We'll use a generic fetch that logs if testing, or sends if valid
    const text = messageText.substring(0, 160); // 160 chars max

    try {
        // SMSPILOT Example
        const url = `https://smspilot.ru/api.php?send=${encodeURIComponent(text)}&to=${phones.join(',')}&apikey=${apiKey}&format=json`;
        const response = await fetch(url);
        if (!response.ok) {
            console.error('SMS notification error, status:', response.status);
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
