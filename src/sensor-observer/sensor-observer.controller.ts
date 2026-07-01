import { Controller, Get } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { SensorObserverService } from '@/sensor-observer/sensor-observer.service';
import { SensorObserverVerdict } from '@/sensor-observer/sensor-screener';
import { LogContext } from '@/shared/logger/logging-context';

@Controller("sensor-observer")
export class SensorObserverController {
  constructor(
    private readonly logger: PinoLogger,
    private readonly service: SensorObserverService,
  ) {
    this.logger.setContext(SensorObserverController.name);
  }

  @Get("/detect")
  async detect(): Promise<SensorObserverVerdict> {
    this.logger.info(
      { [LogContext.ROUTE]: "GET /sensor-observer/detect" },
      "센서 관찰 수동 트리거",
    );

    const verdict: SensorObserverVerdict | null =
      await this.service.detectOnce();

    return (
      verdict ?? {
        triggered: false,
        reason: "드레인할 배치 없음(버퍼 비어있음)",
        offendingSceneKeys: [],
      }
    );
  }
}
