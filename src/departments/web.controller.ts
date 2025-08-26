import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';
import { GetUser } from 'src/auth/decorators';
import { UserRes } from '@types';
import { DepartmentDTO } from './dto/department.dto';

@Controller('web/departments')
export class WebDepartController extends DepartmentsController {
  constructor(private readonly service: DepartmentsService) {
    super(service);
  }

  @Get('/')
  @HttpCode(HttpStatus.OK)
  public async getDepartments(
    @GetUser() user: UserRes,
    @Query('search') search: string = '',
  ) {
    return await this.getDepartmentService().getDepartments(user, search);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/department/:departmentId')
  public async getSingleDepartment(
    @GetUser() user: UserRes,
    @Param('departmentId') departmentId: string,
  ) {
    return this.getDepartmentService().getSingleDepartment(
      departmentId,


    );
  }

  @Post('/')
  @HttpCode(HttpStatus.OK)
  public async createDepartment(@Body() data: DepartmentDTO) {
    return await this.getDepartmentService().createDepartment(data);
  }

  @HttpCode(HttpStatus.OK)
  @Patch('/:departmentId') // :departmentId -> department -> id
  public async updateDepartment(
    @GetUser() user: UserRes,
    @Param('departmentId') departmentId: string,
    @Body() data: any,
  ) {
    return this.getDepartmentService().updateDepartment(
      departmentId,
      data,
    );
  }

  @Get('/branches')
  @HttpCode(HttpStatus.OK)
  public async getBranches(@GetUser() user: UserRes) {
    return await this.getDepartmentService().getBranches(user);
  }

  @Get('/cities')
  @HttpCode(HttpStatus.OK)
  public async getCities() {
    return await this.getDepartmentService().getCities();
  }
}
