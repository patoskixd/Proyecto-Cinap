from dataclasses import dataclass
from typing import List, Optional
from app.use_cases.ports.docente_repos import DocentePerfilRepo
from app.domain.auth.docente_perfil import TeacherInfo

@dataclass
class RegisterTeacherUseCase:
    docente_repo: DocentePerfilRepo
    async def execute(self, *, name: str, email: str) -> TeacherInfo:
        return await self.docente_repo.register_teacher(name=name, email=email)

@dataclass
class ListTeachersUseCase:
    docente_repo: DocentePerfilRepo
    async def execute(self) -> List[TeacherInfo]:
        return await self.docente_repo.list_teachers()

@dataclass
class GetTeacherUseCase:
    docente_repo: DocentePerfilRepo
    async def execute(self, teacher_id: str) -> Optional[TeacherInfo]:
        return await self.docente_repo.get_teacher_by_id(teacher_id)

@dataclass
class UpdateTeacherUseCase:
    docente_repo: DocentePerfilRepo
    async def execute(self, teacher_id: str, *, name: str | None, email: str | None, active: bool | None) -> TeacherInfo:
        return await self.docente_repo.update_teacher(teacher_id, name=name, email=email, active=active)

@dataclass
class DeleteTeacherUseCase:
    docente_repo: DocentePerfilRepo
    async def execute(self, teacher_id: str) -> None:
        await self.docente_repo.delete_teacher(teacher_id)
