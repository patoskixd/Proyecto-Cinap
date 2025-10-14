from datetime import datetime, timezone
from typing import Dict, Any, List
from uuid import UUID

from sqlalchemy import text, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.use_cases.ports.dashboard_stats_repository import DashboardStatsRepository


class SqlAlchemyDashboardStatsRepository(DashboardStatsRepository):
    """Implementación del repositorio de estadísticas usando SQLAlchemy."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_admin_stats(self) -> Dict[str, Any]:
        """
        Obtiene estadísticas para administradores.
        """
        # Consulta total de asesores activos
        advisors_query = text("""
            SELECT COUNT(*) as total
            FROM asesor_perfil 
            WHERE activo = true
        """)
        advisors_result = await self.session.execute(advisors_query)
        advisors_total = advisors_result.scalar() or 0
        
        # Consulta total de docentes activos  
        teachers_query = text("""
            SELECT COUNT(*) as total
            FROM docente_perfil 
            WHERE activo = true
        """)
        teachers_result = await self.session.execute(teachers_query)
        teachers_total = teachers_result.scalar() or 0
        
        # Consulta asesorías confirmadas este mes (no solo creadas)
        now = datetime.now(timezone.utc)
        first_day_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if now.month == 12:
            next_month = datetime(now.year + 1, 1, 1, tzinfo=timezone.utc)
        else:
            next_month = datetime(now.year, now.month + 1, 1, tzinfo=timezone.utc)
        
        # Debug: Consulta más amplia para ver qué hay en la base de datos
        appointments_query = text("""
            SELECT COUNT(*) as total
            FROM asesoria a
            JOIN cupo c ON a.cupo_id = c.id
            WHERE c.inicio >= :first_day
            AND c.inicio < :next_month
        """)
        appointments_result = await self.session.execute(
            appointments_query, 
            {"first_day": first_day_month, "next_month": next_month}
        )
        appointments_month = appointments_result.scalar() or 0
        
        # Debug adicional: contar todas las asesorías para ver si hay datos
        debug_query = text("""
            SELECT 
                COUNT(*) as total_asesorias,
                COUNT(CASE WHEN a.estado = 'CONFIRMADA' THEN 1 END) as confirmadas,
                COUNT(CASE WHEN c.inicio >= :first_day AND c.inicio < :next_month THEN 1 END) as este_mes
            FROM asesoria a
            JOIN cupo c ON a.cupo_id = c.id
        """)
        debug_result = await self.session.execute(
            debug_query, 
            {"first_day": first_day_month, "next_month": next_month}
        )
        debug_info = debug_result.fetchone()
        print(f"DEBUG - Total asesorías: {debug_info.total_asesorias}, Confirmadas: {debug_info.confirmadas}, Este mes: {debug_info.este_mes}")
        
        # Consulta categorías activas
        categories_query = text("""
            SELECT COUNT(*) as total
            FROM categoria 
            WHERE activo = true
        """)
        categories_result = await self.session.execute(categories_query)
        active_categories = categories_result.scalar() or 0
        
        # Consulta servicios activos
        services_query = text("""
            SELECT COUNT(*) as total
            FROM servicio 
            WHERE activo = true
        """)
        services_result = await self.session.execute(services_query)
        active_services = services_result.scalar() or 0
        
        # Consulta asesorías pendientes por confirmar
        pending_query = text("""
            SELECT COUNT(*) as total
            FROM asesoria 
            WHERE estado = 'PENDIENTE'
        """)
        pending_result = await self.session.execute(pending_query)
        pending_count = pending_result.scalar() or 0
        
        return {
            "advisorsTotal": advisors_total,
            "teachersTotal": teachers_total,
            "appointmentsThisMonth": appointments_month,
            "pendingCount": pending_count,
            "activeCategories": active_categories,
            "activeServices": active_services
        }
    
    async def get_advisor_stats(self, advisor_id: UUID) -> Dict[str, Any]:
        """
        Obtiene estadísticas para asesores.
        """
        # Consulta asesorías pendientes del asesor
        pending_query = text("""
            SELECT COUNT(*) as total
            FROM asesoria a
            INNER JOIN cupo c ON a.cupo_id = c.id
            WHERE c.asesor_id = :advisor_id 
            AND a.estado = 'PENDIENTE'
        """)
        pending_result = await self.session.execute(
            pending_query, 
            {"advisor_id": advisor_id}
        )
        pending_count = pending_result.scalar() or 0
        
        # Consulta asesorías del mes actual del asesor
        now = datetime.now(timezone.utc)
        first_day_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_day_month = (now.replace(month=now.month + 1, day=1) 
                         if now.month < 12 
                         else now.replace(year=now.year + 1, month=1, day=1))
        
        month_query = text("""
            SELECT COUNT(*) as total
            FROM asesoria a
            INNER JOIN cupo c ON a.cupo_id = c.id
            WHERE c.asesor_id = :advisor_id 
            AND c.inicio >= :first_day 
            AND c.inicio < :last_day
        """)
        month_result = await self.session.execute(
            month_query, 
            {
                "advisor_id": advisor_id,
                "first_day": first_day_month,
                "last_day": last_day_month
            }
        )
        month_count = month_result.scalar() or 0
        
        # Consulta próximas asesorías confirmadas
        next_appointments_query = text("""
            SELECT 
                a.id,
                c.inicio,
                c.fin,
                s.nombre as servicio_nombre,
                u.nombre as docente_nombre
            FROM asesoria a
            INNER JOIN cupo c ON a.cupo_id = c.id
            INNER JOIN servicio s ON c.servicio_id = s.id
            INNER JOIN docente_perfil dp ON a.docente_id = dp.id
            INNER JOIN usuario u ON dp.usuario_id = u.id
            WHERE c.asesor_id = :advisor_id 
            AND a.estado = 'CONFIRMADA'
            AND c.inicio > :now
            ORDER BY c.inicio ASC
            LIMIT 5
        """)
        next_result = await self.session.execute(
            next_appointments_query,
            {"advisor_id": advisor_id, "now": now}
        )
        next_appointments = [
            {
                "id": str(row.id),
                "inicio": row.inicio.isoformat(),
                "fin": row.fin.isoformat(),
                "servicio": row.servicio_nombre,
                "docente": row.docente_nombre
            }
            for row in next_result.fetchall()
        ]
        
        return {
            "pendingCount": pending_count,
            "monthCount": month_count,
            "nextAppointments": next_appointments
        }
    
    async def get_teacher_stats(self, teacher_id: UUID) -> Dict[str, Any]:
        """
        Obtiene estadísticas para docentes.
        
        Args:
            teacher_id: ID del docente perfil
            
        Returns:
            Dict con: requestedCount, confirmedCount, pendingCount, monthCount
        """
        # Consulta total de asesorías solicitadas por el docente
        requested_query = text("""
            SELECT COUNT(*) as total
            FROM asesoria 
            WHERE docente_id = :teacher_id
        """)
        requested_result = await self.session.execute(
            requested_query, 
            {"teacher_id": teacher_id}
        )
        requested_count = requested_result.scalar() or 0
        
        # Consulta asesorías confirmadas del docente
        confirmed_query = text("""
            SELECT COUNT(*) as total
            FROM asesoria 
            WHERE docente_id = :teacher_id 
            AND estado = 'CONFIRMADA'
        """)
        confirmed_result = await self.session.execute(
            confirmed_query, 
            {"teacher_id": teacher_id}
        )
        confirmed_count = confirmed_result.scalar() or 0
        
        # Consulta asesorías pendientes del docente
        pending_query = text("""
            SELECT COUNT(*) as total
            FROM asesoria 
            WHERE docente_id = :teacher_id 
            AND estado = 'PENDIENTE'
        """)
        pending_result = await self.session.execute(
            pending_query, 
            {"teacher_id": teacher_id}
        )
        pending_count = pending_result.scalar() or 0
        
        # Consulta asesorías del mes actual del docente
        now = datetime.now(timezone.utc)
        first_day_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_day_month = (now.replace(month=now.month + 1, day=1) 
                         if now.month < 12 
                         else now.replace(year=now.year + 1, month=1, day=1))
        
        month_query = text("""
            SELECT COUNT(*) as total
            FROM asesoria a
            INNER JOIN cupo c ON a.cupo_id = c.id
            WHERE a.docente_id = :teacher_id 
            AND c.inicio >= :first_day 
            AND c.inicio < :last_day
        """)
        month_result = await self.session.execute(
            month_query, 
            {
                "teacher_id": teacher_id,
                "first_day": first_day_month,
                "last_day": last_day_month
            }
        )
        month_count = month_result.scalar() or 0
        
        return {
            "requestedCount": requested_count,
            "confirmedCount": confirmed_count,
            "pendingCount": pending_count,
            "monthCount": month_count
        }