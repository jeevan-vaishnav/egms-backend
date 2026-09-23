import "dotenv/config";
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { SwaggerModule } from "@nestjs/swagger";
import { apiReference } from "@scalar/nestjs-api-reference";
import fastifyHelmet from "@fastify/helmet";
import { CorsConfig, getEnv, HelmetConfig, swaggerConfig } from "@config";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // Swagger Configuration=====================
  if (getEnv().API_DOCS_ENABLED) {
    const config = swaggerConfig;
    const document = SwaggerModule.createDocument(app, config, {
      deepScanRoutes: true,
    });

    app.use(
      "/docs",
      apiReference({
        content: document,
        withFastify: true,
        theme: "bluePlanet",
      }),
    );
  }

  // CORS & Helmet Configuration=====================
  app.enableCors(CorsConfig);
  await app.register(fastifyHelmet, HelmetConfig);


  const APP_PORT = getEnv().APP_PORT;
  await app.listen(APP_PORT);
}
bootstrap().then(() => {
  // eslint-disable-next-line no-console
  console.log(
    `Application is running on: http://localhost:${getEnv().APP_PORT}`,
  );
})
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Error during app bootstrap:", err);
    process.exit(1);
  });;