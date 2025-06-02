"use server"
import { Resend } from 'resend'
import { z } from 'zod'
import { mail } from "@/components/kokonutui/particles-background"



export async function sendMail(initialState: mail, formData: FormData): Promise<mail> {

  const userMailSchema = z.object({
    email: z.string({
      invalid_type_error: 'Invalid email',
    }),
    name: z.string({
      invalid_type_error: 'Invalid name',
    }),
    message: z.string({
      invalid_type_error: 'Invalid message',
    }),
  })

  const validatedFields = userMailSchema.safeParse({
    email: formData.get('email'),
    name: formData.get('name'),
    message: formData.get('message')
  })

  // Return early if the form data is invalid
  if (!validatedFields.success) {
    return {
      ...{
        email: formData.get('email')?.toString(),
        name: formData.get('name')?.toString(),
        message: formData.get('message')?.toString()
      },
      errors: validatedFields.error.flatten().fieldErrors
    }
  }

  const { email, name, message } = validatedFields.data

  const resend = new Resend(process.env.M_API)

  try {
    await resend.emails.send({
      from: "ai@aisoft.sh",
      to: email,
      subject: 'Wellcome to AISOFT',
      html: `
  <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      
      <!-- HEADER: AISOFT + wellcome!! -->
      <div style="background-color: #7c3aed; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 32px; color: #ffffff; font-weight: bold;">AISOFT</h1>
        <h2 style="margin: 10px 0 0 0; font-size: 18px; color: #e0e7ff;">wellcome!!</h2>
      </div>
      
      <!-- BODY: messaggio -->
      <div style="padding: 20px; color: #374151; font-size: 16px; line-height: 1.6;">
        <p style="margin: 0;">
              Dear ${name}, thank you for writing to AISOFT! We will reach out to you as soon as possible!
        </p>
        <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
          Per qualsiasi supporto, contattaci a <a href="mailto:support@aisoft.sh" style="color: #7c3aed; text-decoration: none;">support@aisoft.sh</a>.
        </p>
      </div>
      
      <!-- FOOTER -->
      <div style="background-color: #f3f4f6; padding: 10px 20px; text-align: center; font-size: 12px; color: #6b7280;">
        © ${new Date().getFullYear()} AISOFT. All rights reserved.
      </div>

    </div>
  </div>
  `    })
    return {
      ...validatedFields.data,
    }
  } catch (error) {
    console.error('Errore invio mail:', error)
    return {
      ...validatedFields.data,
    }
  }
}
