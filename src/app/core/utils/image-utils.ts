// 動態導入 heic2any（如果可用）
let heic2any: any = null;

// 嘗試導入 heic2any 庫
import('heic2any').then(module => {
  heic2any = module.default;
}).catch(() => {
  console.warn('heic2any 庫未載入，HEIC 轉換將不可用');
});

/**
 * 驗證單個圖片檔案
 * @param file 檔案
 * @param maxSizeMB 最大檔案大小（MB，預設 10）
 * @returns { valid: boolean, error?: string }
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = 10
): { valid: boolean; error?: string } {
  // 支援的格式
  const allowedMimes = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.heic', '.heif'];

  // 檢查 MIME 類型
  if (!allowedMimes.includes(file.type)) {
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return {
        valid: false,
        error: `不支援的圖片格式：${file.type || ext}。請使用 JPG、PNG 或 HEIC 格式。`
      };
    }
  }

  // 檢查檔案大小
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `檔案過大：${sizeMB}MB。最大允許大小為 ${maxSizeMB}MB。`
    };
  }

  return { valid: true };
}

/**
 * 驗證多個圖片檔案
 * @param files 檔案陣列
 * @param maxCount 最大檔案數（預設 10）
 * @param maxSizeMB 每個檔案的最大大小（MB，預設 10）
 * @returns { valid: boolean, errors: string[] }
 */
export function validateMultipleImages(
  files: File[],
  maxCount: number = 10,
  maxSizeMB: number = 10
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 檢查數量
  if (files.length > maxCount) {
    errors.push(`最多只能上傳 ${maxCount} 張圖片，目前共 ${files.length} 張。`);
  }

  // 檢查每個檔案
  files.forEach((file, index) => {
    const validation = validateImageFile(file, maxSizeMB);
    if (!validation.valid && validation.error) {
      errors.push(`第 ${index + 1} 個檔案：${validation.error}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 將 HEIC 檔案轉換為 JPEG Blob
 * @param file HEIC 檔案
 * @returns 轉換後的 Blob（JPEG）
 */
async function convertHeicToJpeg(file: File): Promise<Blob> {
  if (!heic2any) {
    throw new Error('HEIC 轉換功能不可用。請確認已安裝 heic2any 庫。');
  }

  try {
    // 使用 heic2any 將 HEIC 轉換為 JPEG Blob
    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.8
    });

    // heic2any 可能返回 Blob 或 Blob 陣列
    return Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
  } catch (error) {
    throw new Error(`HEIC 轉換失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
  }
}

/**
 * 檢查檔案是否為 HEIC 格式
 * @param file 檔案
 * @returns true 如果是 HEIC 格式
 */function isHeicFormat(file: File): boolean {
  const heicMimes = ['image/heic', 'image/heif'];
  const heicExtensions = ['.heic', '.heif'];

  const mimeMatch = heicMimes.includes(file.type);
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  const extMatch = heicExtensions.includes(ext);

  return mimeMatch || extMatch;
}

/**
 * 壓縮並調整圖片大小
 * @param file 原始檔案（支援 JPG、PNG、HEIC）
 * @param maxWidth 最大寬度 (預設 1024)
 * @param maxHeight 最大高度 (預設 1024)
 * @param quality 壓縮品質 (0.1 - 1.0)
 * @returns 壓縮後的 Blob（JPEG 格式）
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1024,
  maxHeight: number = 1024,
  quality: number = 0.8
): Promise<Blob> {
  // 驗證檔案
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || '檔案驗證失敗');
  }

  // 如果是 HEIC 格式，先轉換為 JPEG
  let blobToProcess = file;
  if (isHeicFormat(file)) {
    try {
      const convertedBlob = await convertHeicToJpeg(file);
      // 將 Blob 轉換為 File，以便後續處理
      blobToProcess = new File([convertedBlob], file.name, { type: 'image/jpeg' });
    } catch (error) {
      throw new Error(`HEIC 轉換失敗：${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blobToProcess);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // 計算縮放比例
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('無法取得 Canvas Context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('圖片轉換失敗'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * 批量壓縮多個圖片檔案
 * @param files 檔案陣列
 * @param maxCount 最大檔案數（預設 10）
 * @param maxSizeMB 每個檔案的最大大小（MB，預設 10）
 * @returns Promise<{ blobs: Blob[], errors: string[] }>
 */
export async function compressMultipleImages(
  files: File[],
  maxCount: number = 10,
  maxSizeMB: number = 10
): Promise<{ blobs: Blob[]; errors: string[] }> {
  // 驗證所有檔案
  const validation = validateMultipleImages(files, maxCount, maxSizeMB);
  if (!validation.valid) {
    return {
      blobs: [],
      errors: validation.errors
    };
  }

  const blobs: Blob[] = [];
  const errors: string[] = [];

  // 逐個壓縮檔案
  for (let i = 0; i < files.length; i++) {
    try {
      const blob = await compressImage(files[i]);
      blobs.push(blob);
    } catch (error) {
      errors.push(
        `第 ${i + 1} 個檔案（${files[i].name}）壓縮失敗：${
          error instanceof Error ? error.message : '未知錯誤'
        }`
      );
    }
  }

  return { blobs, errors };
}
