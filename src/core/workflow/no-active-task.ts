/** The error of an action that needs an active task, with a `Gợi ý:` line naming how to get one. */
export function noActiveTaskError(label: string): Error {
  return new Error(
    `${label} requires an active task.\nGợi ý: kích hoạt một task bằng harnix resume <task-id> (liệt kê: harnix tasks --status in_progress --brief) hoặc tạo task mới bằng harnix workflow --init --title "<tiêu đề>" --slug <english-kebab-case>.`,
  );
}
