import {
  BadRequestException,
  Controller,
  InternalServerErrorException,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CsvService } from "./csv.service";

@UseGuards(JwtAuthGuard)
@Controller("csv")
export class CsvController {
  constructor(private readonly csv: CsvService) {}

  @Post("upload")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("file は必須です");
    }

    try {
      const data = await this.csv.importCsv({
        originalName: file.originalname,
        content: file.buffer,
      });

      return { data };
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      if (e instanceof InternalServerErrorException) throw e;
      // 想定外
      throw new InternalServerErrorException(
        e instanceof Error ? e.message : "CSVアップロードでエラーが発生しました",
      );
    }
  }
}
