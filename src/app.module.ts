import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { PatientsModule } from './patients/patients.module';
import { RendezVousModule } from './rendezvous/rendezvous.module';
import { ArchivesModule } from './archives/archives.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ServicesExternesModule } from './services-externes/services-externes.module';
import { SeancesModule } from './seances/seances.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: true,
        // SSL activé par défaut (bases distantes type Render/Railway),
        // désactivé en local via DB_SSL=false
        ssl:
          config.get<string>('DB_SSL') === 'false'
            ? false
            : { rejectUnauthorized: false },
      }),
    }),
    PatientsModule,
    RendezVousModule,
    ArchivesModule,
    NotificationsModule,
    ServicesExternesModule,
    SeancesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
