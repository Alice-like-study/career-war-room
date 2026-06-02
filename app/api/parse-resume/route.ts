/**

 * 简历 PDF 解析 API

 * 接收 multipart/form-data 上传的 PDF 文件，提取文字内容返回

 */



import { createRequire } from 'node:module';



// 强制使用 Node.js runtime（pdf-parse 依赖 Node.js 原生模块）

export const runtime = 'nodejs';



// 文件大小限制：5MB

const MAX_FILE_SIZE = 5 * 1024 * 1024;



type PdfParseResult = {

  text: string;

  numpages: number;

  info: Record<string, unknown>;

};



/** 运行时加载 pdf-parse，避免 Next.js webpack 打包 pdf.js 导致报错 */

function loadPdfParse(): (buffer: Buffer) => Promise<PdfParseResult> {

  const require = createRequire(import.meta.url);

  return require('pdf-parse') as (buffer: Buffer) => Promise<PdfParseResult>;

}



/**

 * 解析 FormData 中的文件

 */

async function parseFormData(req: Request): Promise<{ buffer: Buffer; filename: string; size: number }> {

  const contentType = req.headers.get('content-type') || '';



  if (!contentType.includes('multipart/form-data')) {

    throw new Error('Content-Type 必须是 multipart/form-data');

  }



  // 使用原生 Web API 解析 formData

  const formData = await req.formData();

  const file = formData.get('file');



  if (!file || !(file instanceof File)) {

    throw new Error('缺少 file 字段或字段不是文件');

  }



  // 检查文件类型

  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {

    throw new Error('只支持 PDF 文件');

  }



  // 检查文件大小

  if (file.size > MAX_FILE_SIZE) {

    throw new Error(`文件大小超过限制（最大 ${MAX_FILE_SIZE / 1024 / 1024}MB）`);

  }



  // 将 File 转换为 Buffer

  const arrayBuffer = await file.arrayBuffer();

  const buffer = Buffer.from(arrayBuffer);



  return {

    buffer,

    filename: file.name,

    size: file.size,

  };

}



/**

 * POST 接口：解析 PDF 简历

 */

export async function POST(req: Request): Promise<Response> {

  try {

    // 1. 解析上传的文件

    const { buffer, filename, size } = await parseFormData(req);



    // 2. 使用 pdf-parse 提取文字

    const pdfParse = loadPdfParse();

    const pdfData = await pdfParse(buffer);



    // 3. 清理提取的文本（去除多余空白）

    const cleanedText = pdfData.text

      .replace(/\r\n/g, '\n')     // 统一换行符

      .replace(/\r/g, '\n')

      .replace(/\n{3,}/g, '\n\n') // 最多保留两个连续换行

      .trim();



    // 4. 返回解析结果

    return Response.json({

      success: true,

      data: {

        text: cleanedText,

        filename,

        size,

        pages: pdfData.numpages,

        info: pdfData.info,

      },

    });



  } catch (error) {

    console.error('[parse-resume] 解析失败:', error);



    // 返回友好的错误信息

    const message = error instanceof Error ? error.message : '解析失败，请稍后重试';



    return Response.json(

      {

        success: false,

        error: message,

      },

      { status: 400 }

    );

  }

}


