import * as nodemailer from 'nodemailer';
import * as OneSignal from 'onesignal-node';
import { Donor } from '../src/types.js';

let transporter: nodemailer.Transporter | null = null;
let oneSignalClient: OneSignal.Client | null = null;

// Single delivery path over SMTP (nodemailer).
async function deliverEmail(opts: { to?: string; bcc?: string[]; subject: string; html: string }): Promise<{ ok: boolean; id?: string; error?: string; provider: string }> {
    const t = getTransporter();
    if (!t) return { ok: false, error: 'SMTP не настроен: отсутствуют SMTP_EMAIL и/или SMTP_PASSWORD.', provider: 'none' };
    try {
        const info = await t.sendMail({
            from: `"Donor-Alert" <${process.env.SMTP_EMAIL}>`,
            to: opts.to,
            bcc: opts.bcc,
            subject: opts.subject,
            html: opts.html,
        });
        return { ok: true, id: info.messageId, provider: 'smtp' };
    } catch (e: any) {
        return { ok: false, error: e?.message || String(e), provider: 'smtp' };
    }
}

function resolveSmtpHost(email: string): string | undefined {
    if (process.env.SMTP_HOST) return process.env.SMTP_HOST;
    if (email.includes('@gmail.com')) return 'smtp.gmail.com';
    if (email.includes('@yandex')) return 'smtp.yandex.ru';
    if (email.includes('@mail.ru')) return 'smtp.mail.ru';
    return undefined;
}

let smtpConfigWarned = false;
function getTransporter(): nodemailer.Transporter | null {
    if (transporter) return transporter;
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
        if (!smtpConfigWarned) {
            console.warn('[Email] SMTP НЕ настроен: задайте SMTP_EMAIL и SMTP_PASSWORD. Письма пропускаются.');
            smtpConfigWarned = true;
        }
        return null;
    }
    // Default to 587/STARTTLS — it passes through more firewalls (incl. PaaS hosts)
    // than 465/SSL. We do NOT use nodemailer's `service: 'gmail'` shortcut because it
    // forces port 465 and ignores SMTP_PORT.
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
    const secure = smtpPort === 465;
    // Gmail App Passwords are shown as "xxxx xxxx xxxx xxxx" (19 chars with spaces);
    // strip whitespace so a pasted-with-spaces value still authenticates (Gmail expects
    // the 16 chars without spaces).
    const pass = process.env.SMTP_PASSWORD.replace(/\s+/g, '');
    transporter = nodemailer.createTransport({
        host: resolveSmtpHost(process.env.SMTP_EMAIL),
        port: smtpPort,
        secure,
        requireTLS: !secure, // force STARTTLS upgrade on 587
        auth: {
            user: process.env.SMTP_EMAIL,
            pass
        },
        // Fail fast on a bad/slow SMTP config instead of hanging the request.
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 20000
    });
    console.log(`[Email] SMTP-транспорт создан: ${resolveSmtpHost(process.env.SMTP_EMAIL)}:${smtpPort} (secure=${secure}).`);
    return transporter;
}

// Non-secret summary of the current email configuration (for the admin diagnostics endpoint).
export function getEmailDiagnostics() {
    const email = process.env.SMTP_EMAIL || '';
    const masked = email ? email.replace(/^(.{2}).*(@.*)$/, '$1***$2') : null;
    const host = resolveSmtpHost(email) || null;
    const cleanPassLen = process.env.SMTP_PASSWORD ? process.env.SMTP_PASSWORD.replace(/\s+/g, '').length : 0;
    return {
        provider: (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) ? 'SMTP (nodemailer)' : 'нет',
        configured: !!(process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD),
        smtpEmailSet: !!process.env.SMTP_EMAIL,
        smtpPasswordSet: !!process.env.SMTP_PASSWORD,
        user: masked,
        host,
        port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
        // Длина пароля после удаления пробелов (Gmail App Password = 16 символов).
        passwordLength: cleanPassLen
    };
}

// Actively test the SMTP connection + auth (handshake + login), without sending mail.
export async function verifyEmailTransport(): Promise<{ ok: boolean; error?: string }> {
    const t = getTransporter();
    if (!t) return { ok: false, error: 'SMTP не настроен: отсутствуют SMTP_EMAIL и/или SMTP_PASSWORD.' };
    try {
        await t.verify();
        return { ok: true };
    } catch (e: any) {
        return { ok: false, error: e?.message || String(e) };
    }
}

// Send a one-off test email and return the real outcome.
export async function sendTestEmail(to: string): Promise<{ ok: boolean; messageId?: string; error?: string }> {
    const result = await deliverEmail({
        to,
        subject: 'Донор-Алерт: тестовое письмо',
        html: '<h2>Тест прошёл успешно ✅</h2><p>Если вы видите это письмо — отправка e-mail настроена корректно.</p>'
    });
    return { ok: result.ok, messageId: result.id, error: result.error };
}

function getOneSignal(): OneSignal.Client | null {
    if (!oneSignalClient && process.env.ONESIGNAL_REST_API_KEY && process.env.VITE_ONESIGNAL_APP_ID) {
        oneSignalClient = new OneSignal.Client(process.env.VITE_ONESIGNAL_APP_ID, process.env.ONESIGNAL_REST_API_KEY);
    }
    return oneSignalClient;
}

export async function sendPushNotification(playerIds: string[], messageText: string, heading?: string) {
    const client = getOneSignal();
    if (!client || playerIds.length === 0) return;

    const title = heading || 'Донор-Алерт: требуется кровь';
    try {
        const notification = {
            contents: {
                'en': messageText,
                'ru': messageText,
            },
            headings: {
                'en': title,
                'ru': title,
            },
            include_player_ids: playerIds,
        };
        await client.createNotification(notification);
    } catch (e) {
        console.error('Push notification error:', e);
    }
}

export async function sendEmailNotification(emails: string[], messageText: string, centerPhone: string) {
    if (emails.length === 0) return;

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

    const result = await deliverEmail({ bcc: emails, subject: 'Донор-Алерт: требуется кровь', html: htmlContent });
    if (result.ok) {
        console.log(`[Email] Массовая рассылка ${emails.length} получателям через ${result.provider} (id: ${result.id}).`);
    } else {
        console.warn(`[Email] Массовая рассылка НЕ отправлена (${emails.length}): ${result.error}`);
    }
}

export async function sendTransactionalEmail(to: string, type: 'welcome' | 'center_added' | 'reset' | 'confirmed' | 'rejected' | 'appointment_rejected', extra?: any) {
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
    } else if (type === 'appointment_rejected') {
        subject = 'Ваша запись на донацию отклонена';
        const whenLine = extra?.date
            ? `<p><strong>Дата записи:</strong> ${extra.date}${extra?.time ? ` в ${extra.time}` : ''}</p>`
            : '';
        htmlContent = `
            <h2>Ваша запись на донацию отклонена</h2>
            ${whenLine}
            <p><strong>Причина:</strong> ${extra?.reason || 'Не указана'}</p>
            <p>Вы можете записаться на другую дату в личном кабинете.</p>
            <a href="https://donor-by.vercel.app">Войти в кабинет</a>
        `;
    }

    const result = await deliverEmail({ to, subject, html: htmlContent });
    if (result.ok) {
        console.log(`[Email] Отправлено "${type}" → ${to} через ${result.provider} (id: ${result.id}).`);
    } else {
        console.warn(`[Email] НЕ отправлено "${type}" → ${to}: ${result.error}`);
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

            const needsPush = ['push', 'all'].includes(channel);
            const needsEmail = ['email', 'all'].includes(channel);

            for (const donor of donors) {
                if (needsPush && donor.pushEnabled && donor.onesignalPlayerId) {
                    pushPlayerIds.push(donor.onesignalPlayerId);
                }
                if (needsEmail && donor.emailNotificationsEnabled && donor.email) {
                    emails.push(donor.email);
                }
            }

            const tasks = [];
            if (pushPlayerIds.length > 0) tasks.push(sendPushNotification(pushPlayerIds, messageText));
            if (emails.length > 0) tasks.push(sendEmailNotification(emails, messageText, centerPhone));

            await Promise.allSettled(tasks);
        } catch (e) {
            console.error('Dispatch notifications failed:', e);
        }
    });
}
