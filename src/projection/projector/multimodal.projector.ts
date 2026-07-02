import { Injectable } from '@nestjs/common';
import { InferInsertModel } from 'drizzle-orm';
import { PinoLogger } from 'nestjs-pino';
import { ToyDataDto, toyDataSchema } from '@/insert/dto/toy-data.dto';
import { IntegrityViolation, Projector } from '@/projection/projector/projector';
import { DrizzleTx } from '@/shared/database/drizzle.provider';
import { readMultimodal } from '@/shared/database/schema';
import { LogAction, LogContext } from '@/shared/logger/logging-context';
import { EventStoreEventRow } from '../repository/event-store-reader.repository';

type ReadMultimodalInsert = InferInsertModel<typeof readMultimodal>;

// 모달 파일명(2D/video 등)에서 scene(5자리)·attempt(2자리)를 확장자 불문으로 뽑는다.
// 예: ..._00001_01_20230923.jpg → { sceneNum: "00001", attemptNum: 1 }
const MODAL_FILE_NAME_RE: RegExp = /_(\d{5})_(\d{2})_\d{8}\.[A-Za-z0-9]+$/;

// scene_key 는 ..._{sceneNum} 로 끝난다(파서 규칙). 끝의 5자리를 권위 있는 scene 으로 본다.
const SCENE_KEY_NUM_RE: RegExp = /_(\d{5})$/;

type ParsedModalFileName = {
  sceneNum: string;
  attemptNum: number;
};

function parseModalFileName(fileName: string): ParsedModalFileName | null {
  const matched = MODAL_FILE_NAME_RE.exec(fileName);

  if (matched === null) {
    return null;
  }

  return { sceneNum: matched[1], attemptNum: Number(matched[2]) };
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

@Injectable()
export class MultiModalProjector implements Projector<ReadMultimodalInsert> {
  readonly name: string = "multimodal-projector";

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(MultiModalProjector.name);
  }

  map(event: EventStoreEventRow): ReadMultimodalInsert {
    let payload: ToyDataDto;
    try {
      payload = toyDataSchema.parse(event.payload);
    } catch (err) {
      this.logger.error(
        {
          action: LogAction.MAP_FAILED,
          err,
          [LogContext.EVENT_ID]: event.eventId,
          [LogContext.STREAM_ID]: event.streamId,
          [LogContext.ATTEMPT_NUM]: event.attemptNum,
          [LogContext.GLOBAL_SEQ]: event.globalSeq,
        },
        "이벤트 매핑(검증) 실패",
      );

      throw err;
    }

    this.logger.debug(
      {
        action: LogAction.EVENT_MAPPED,
        [LogContext.PROJECTOR_NAME]: this.name,
        [LogContext.SCENE_KEY]: event.streamId.replace(/^grip-attempt:/, ""),
        [LogContext.ATTEMPT_NUM]: event.attemptNum,
        [LogContext.GLOBAL_SEQ]: event.globalSeq,
      },
      "이벤트 매핑",
    );

    return {
      sceneKey: event.streamId.replace(/^grip-attempt:/, ""),
      attemptNum: event.attemptNum,
      occurredAt: event.occurredAt,
      image2dFileName: payload["2D_image_file_name"],
      image2dUri: null,
      videoFileName: payload.video_file_name,
      videoUri: null,
      streamId: event.streamId,
      globalSeq: event.globalSeq,
    };
  }

  async upsert(tx: DrizzleTx, row: ReadMultimodalInsert): Promise<void> {
    await tx
      .insert(readMultimodal)
      .values(row)
      .onConflictDoUpdate({
        target: [readMultimodal.sceneKey, readMultimodal.attemptNum],
        set: {
          occurredAt: row.occurredAt,
          image2dFileName: row.image2dFileName,
          image2dUri: row.image2dUri,
          videoFileName: row.videoFileName,
          videoUri: row.videoUri,
          streamId: row.streamId,
          globalSeq: row.globalSeq,
        },
      });
  }

  // read_multimodal 정합성 규칙. toy-data 139건 전수 확인된 이 도메인의 파일명 규약:
  //  - 2D 이미지: attempt 단위 → 파일명 attempt == event attempt_num, scene == scene_key.
  //  - video: scene 단위 sentinel(항상 _00_) → 모든 attempt 가 공유하므로 attempt 는 대조하지
  //    않고 scene 만 검사한다(여기서 attempt 를 대조하면 정상 데이터 전부가 오탐된다).
  // 구조(zod)는 통과하지만 모달 미디어가 다른 scene/attempt 를 가리키는 의미적 오류를 잡는다.
  checkIntegrity(row: ReadMultimodalInsert): IntegrityViolation[] {
    const violations: IntegrityViolation[] = [];

    const sceneKeyMatch = SCENE_KEY_NUM_RE.exec(row.sceneKey);
    const expectedSceneNum: string | null = sceneKeyMatch?.[1] ?? null;

    // expectedAttempt: null = attempt 대조 안 함(scene 단위 모달).
    const modals: {
      column: string;
      dimension: string;
      fileName: string | null | undefined;
      expectedAttempt: number | null;
    }[] = [
      {
        column: "image_2d_file_name",
        dimension: "2D 이미지",
        fileName: row.image2dFileName,
        expectedAttempt: row.attemptNum,
      },
      {
        column: "video_file_name",
        dimension: "비디오",
        fileName: row.videoFileName,
        expectedAttempt: null,
      },
    ];

    for (const modal of modals) {
      if (modal.fileName === null || modal.fileName === undefined) {
        continue;
      }

      const parsed = parseModalFileName(modal.fileName);

      if (parsed === null) {
        violations.push({
          readModelName: "read_multimodal",
          sceneKey: row.sceneKey,
          attemptNum: row.attemptNum,
          streamId: row.streamId,
          globalSeq: row.globalSeq,
          ruleName: "modalFileNameParseable",
          affectedColumns: [modal.column],
          observedValue: modal.fileName,
          expected: "{scene}_{attempt}_{date}.{ext} 형식",
          detail: `read_multimodal 정합성 위반[modalFileNameParseable]: ${modal.dimension} 파일명이 표준 형식을 벗어나 scene/attempt 를 판별할 수 없음. scene_key=${row.sceneKey}, column=${modal.column}, observed="${modal.fileName}".`,
        });

        continue;
      }

      if (
        modal.expectedAttempt !== null &&
        parsed.attemptNum !== modal.expectedAttempt
      ) {
        violations.push({
          readModelName: "read_multimodal",
          sceneKey: row.sceneKey,
          attemptNum: row.attemptNum,
          streamId: row.streamId,
          globalSeq: row.globalSeq,
          ruleName: "modalFileNameAttemptConsistency",
          affectedColumns: [modal.column],
          observedValue: modal.fileName,
          expected: `attempt=${pad2(modal.expectedAttempt)} (event attempt_num 기준)`,
          detail: `read_multimodal 정합성 위반[modalFileNameAttemptConsistency]: ${modal.dimension} 파일명의 attempt(${pad2(parsed.attemptNum)})가 이 행의 권위 attempt(${pad2(modal.expectedAttempt)})와 불일치 — 다른 시도의 미디어가 scene_key=${row.sceneKey} 행에 매핑됨. column=${modal.column}, observed="${modal.fileName}".`,
        });
      }

      if (expectedSceneNum !== null && parsed.sceneNum !== expectedSceneNum) {
        violations.push({
          readModelName: "read_multimodal",
          sceneKey: row.sceneKey,
          attemptNum: row.attemptNum,
          streamId: row.streamId,
          globalSeq: row.globalSeq,
          ruleName: "modalFileNameSceneConsistency",
          affectedColumns: [modal.column],
          observedValue: modal.fileName,
          expected: `scene=${expectedSceneNum} (scene_key 기준)`,
          detail: `read_multimodal 정합성 위반[modalFileNameSceneConsistency]: ${modal.dimension} 파일명의 scene(${parsed.sceneNum})이 scene_key(${expectedSceneNum})와 불일치 — 다른 장면의 미디어가 매핑됨. column=${modal.column}, observed="${modal.fileName}".`,
        });
      }
    }

    return violations;
  }
}
