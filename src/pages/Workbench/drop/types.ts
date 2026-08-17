export type DroppedFile = {
  path: string;
  content: string;
};

export type DropReadErrorCode =
  'empty' | 'multiple' | 'directory' | 'unsupported' | 'read_failed';

export type DropReadOk = { ok: true; file: DroppedFile };
export type DropReadErr = { ok: false; code: DropReadErrorCode };
export type DropReadResult = DropReadOk | DropReadErr;
