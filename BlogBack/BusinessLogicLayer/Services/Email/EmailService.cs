using System;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using MailKit;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using SharedLayer.ConfigClasses;

namespace BusinessLogicLayer.Services.Email;

public class EmailService : IEmailService
{
    private readonly EmailSettings _emailSettings;

    public EmailService(IOptions<EmailSettings> emailSettings)
    {
        _emailSettings = emailSettings.Value;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string body)
    {
        if (string.IsNullOrWhiteSpace(_emailSettings.SenderEmail) ||
            string.IsNullOrWhiteSpace(_emailSettings.Password))
        {
            // The reset-password flow is deferred by product decision until SMTP
            // credentials are provisioned (see README-SECRETS.md). Fail loudly and
            // cleanly instead of throwing transport errors.
            throw new InvalidOperationException(
                "Email sending is not configured (EmailSettings are missing credentials).");
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_emailSettings.SenderName, _emailSettings.SenderEmail));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = subject;
        message.Body = new BodyBuilder { HtmlBody = body }.ToMessageBody();

        using var client = new SmtpClient();
        await client.ConnectAsync(_emailSettings.Server, _emailSettings.Port, SecureSocketOptions.StartTls);
        await client.AuthenticateAsync(Encoding.UTF8,
            new NetworkCredential(_emailSettings.SenderEmail, _emailSettings.Password));
        await client.SendAsync(FormatOptions.Default, new SendRequest(message));
        await client.DisconnectAsync(true);
    }
}
