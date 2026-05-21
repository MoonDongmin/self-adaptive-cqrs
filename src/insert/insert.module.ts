import { Module } from "@nestjs/common";
import { InsertController } from "@/insert/insert.controller";
import { InsertService } from "@/insert/insert.service";
import { EVENT_STORE_REPOSITORY } from "@/insert/repository/event-store.repository";
import { EventStoreRepositoryImpl } from "@/insert/repository/event-store.repository.impl";

@Module({
  controllers: [InsertController],
  providers: [
    InsertService,
    {
      provide: EVENT_STORE_REPOSITORY,
      useClass: EventStoreRepositoryImpl,
    },
  ],
})
export class InsertModule {}
