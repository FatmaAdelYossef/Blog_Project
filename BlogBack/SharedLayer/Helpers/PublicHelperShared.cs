using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SharedLayer.Helpers;

public class PublicHelperShared
{

    public static string GenerateEmailTemplate(string title, string? codeOrLink = "", bool isLink = false)
    {
        string actionSection = string.Empty;

        if (!string.IsNullOrEmpty(codeOrLink))
        {
            if (isLink)
            {
                // لو هو رابط إعادة تعيين كلمة المرور (بنحطه جوه زرار شيك)
                actionSection = $@"<div style='text-align: center; margin: 30px 0;'>
                  <a href='{codeOrLink}' style='background-color: #007bff; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;'>Reset Password</a>
               </div>";
            }
            else
            {
                // لو هو كود تحقق عادي (زي الـ OTP)
                actionSection = $@"<div style='background-color: #f4f4f7; border-radius: 6px; padding: 15px; text-align: center; margin: 20px 0;'>
                  <span style='font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #333;'>{codeOrLink}</span>
               </div>";
            }
        }

        return $@"
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='utf-8'>
        <style>
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #e9ecef;
                margin: 0;
                padding: 0;
                -webkit-font-smoothing: antialiased;
            }}
            .email-container {{
                max-width: 600px;
                margin: 40px auto;
                background: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
            }}
            .email-header {{
                background-color: #007bff;
                color: #ffffff;
                text-align: center;
                padding: 30px 20px;
            }}
            .email-header h1 {{
                margin: 0;
                font-size: 22px;
                font-weight: 600;
            }}
            .email-body {{
                padding: 30px;
                color: #495057;
                line-height: 1.6;
                font-size: 16px;
            }}
            .email-footer {{
                background-color: #f8f9fa;
                text-align: center;
                padding: 15px;
                font-size: 13px;
                color: #6c757d;
                border-top: 1px solid #eaeaea;
            }}
        </style>
    </head>
    <body>
        <div class='email-container'>
            <div class='email-header'>
                <h1>Blog App Security</h1>
            </div>
            <div class='email-body'>
                <p>Hello,</p>
                <p>{title}</p>
                
                {actionSection}
                
                <p>If you did not request this, please ignore this email.</p>
                <p>Best regards,<br><strong>Blog Team</strong></p>
            </div>
            <div class='email-footer'>
                &copy; 2026 Blog App. All rights reserved.
            </div>
        </div>
    </body>
    </html>";
    }


    public static bool IsGuidFileName(string url)
    {
        if (string.IsNullOrEmpty(url)) return false;

        // فصل اسم الملف عن الامتداد (مثال: 259481a8bc844e508aba8cfb65c0a9a9.jpg)
        var fileNameWithoutExtension = Path.GetFileNameWithoutExtension(url);

        bool is32Hex = fileNameWithoutExtension?.Length == 32 &&
                       System.Text.RegularExpressions.Regex.IsMatch(fileNameWithoutExtension, "^[a-fA-F0-9]{32}$");

        return is32Hex;
    }

}
