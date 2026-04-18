import { Controller, Post, Body, BadRequestException, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DteImportParserService } from './services/dte-import-parser.service';
import { PreviewDteDto, DteFormat } from './dto/preview-dte.dto';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';

@ApiTags('received-dtes')
@Controller('received-dtes')
@ApiBearerAuth()
export class ReceivedDtesController {
  private readonly logger = new Logger(ReceivedDtesController.name);

  constructor(private readonly parser: DteImportParserService) {}

  @Post('preview')
  @RequirePermission('purchases:create')
  @ApiOperation({ summary: 'Parsear DTE sin persistir (preview para form de compra)' })
  preview(@Body() dto: PreviewDteDto) {
    if (dto.format === DteFormat.XML) {
      // TODO: XML parsing support — requires xml-to-json conversion (out of A1 scope).
      throw new BadRequestException({
        code: 'FORMAT_NOT_SUPPORTED',
        message: 'XML format not yet supported; please convert to JSON first',
      });
    }
    return this.parser.parse(dto.content);
  }
}
