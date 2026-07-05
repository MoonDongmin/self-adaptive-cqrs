import { Module } from '@nestjs/common';
import { DIAGNOSIS_TOOLKIT } from '@/analysis/tools/diagnosis-toolkit';
import { DiagnosisToolkitImpl } from '@/analysis/tools/diagnosis-toolkit.impl';
import { InsightModule } from '@/insight/insight.module';
import { SensorObserverController } from '@/sensor-observer/sensor-observer.controller';
import { SensorObserverService } from '@/sensor-observer/sensor-observer.service';
import { SensorValueConsumer } from '@/sensor-observer/sensor-value.consumer';

@Module({
  imports: [InsightModule],
  controllers: [SensorObserverController],
  providers: [
    SensorValueConsumer,
    SensorObserverService,
    {
      provide: DIAGNOSIS_TOOLKIT,
      useClass: DiagnosisToolkitImpl,
    },
  ],
})
export class SensorObserverModule {}
