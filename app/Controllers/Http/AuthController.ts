import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { schema, rules, validator } from "@ioc:Adonis/Core/Validator";
import User from "App/Models/User";
import RegisterValidator from "App/Validators/RegisterValidator";

export default class AuthController {
  public async login({ request, response, auth }: HttpContextContract) {
    try {
      const payload = await request.validate({
        schema: schema.create({
          email: schema.string([rules.email()]),
          password: schema.string(),
        }),
        reporter: validator.reporters.vanilla,
      });

      const user = await User.findBy("email", payload.email);

      if (!user) {
        return response.status(404).json({ message: "User not found" });
      }

      const token = await auth.attempt(payload.email, payload.password);
      const { password, ...rest } = user.$original;
      return response.json({
        data: {
          user: rest,
          token: token,
        },
      });
    } catch (error) {
      if (error.messages) {
        return response.status(400).json({ message: error.messages });
      }
      return response
        .status(401)
        .json({ message: "Invalid email or password" });
    }
  }

  public async register({ request, response }: HttpContextContract) {
    const payload = await request.validate(RegisterValidator);

    try {
      await User.create(payload);
      return response.status(201).json({
        status: 201,
        message: "Account created successfully",
      });
    } catch (error) {
      return response.status(500).json({
        message: "Internal Server Error",
      });
    }
  }

  public async getUser({ response, auth }: HttpContextContract) {
    try {
      const user = auth.use("api").user;
      return response.status(200).json({
        message: "User fetched successfully",
        data: user,
      });
    } catch (error) {}
  }

  public async logout({ response, auth }: HttpContextContract) {
    try {
      await auth.use("api").logout();
      return response.status(200).json({
        message: "User logout successfully",
      });
    } catch (error) {}
  }
}
