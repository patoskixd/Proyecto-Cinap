from typing import Optional, Tuple
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def get_user_profile_info(
    user_data: dict, 
    session: AsyncSession
) -> Tuple[str, Optional[UUID]]:
    """
    Obtiene información del perfil del usuario basado en el JWT.
    """
    user_id = user_data.get("sub")
    if not user_id:
        raise ValueError("No se encontró el ID del usuario en el token")
    
    # Obtener información del usuario y rol
    user_query = text("""
        SELECT u.id, r.nombre as rol_nombre
        FROM usuario u
        INNER JOIN rol r ON u.rol_id = r.id
        WHERE u.id = :user_id
    """)
    
    user_result = await session.execute(user_query, {"user_id": user_id})
    user_row = user_result.fetchone()
    
    if not user_row:
        raise ValueError(f"Usuario {user_id} no encontrado")
    
    rol_nombre = user_row.rol_nombre
    
    # Si es Admin, no necesita profile_id
    if rol_nombre == "Admin":
        return rol_nombre, None
    
    # Para Asesor, obtener asesor_perfil
    if rol_nombre == "Asesor":
        asesor_query = text("""
            SELECT id FROM asesor_perfil 
            WHERE usuario_id = :user_id AND activo = true
        """)
        asesor_result = await session.execute(asesor_query, {"user_id": user_id})
        asesor_row = asesor_result.fetchone()
        
        if not asesor_row:
            raise ValueError(f"Perfil de asesor no encontrado para usuario {user_id}")
        
        return rol_nombre, asesor_row.id
    
    # Para Profesor, obtener docente_perfil
    if rol_nombre == "Profesor":
        docente_query = text("""
            SELECT id FROM docente_perfil 
            WHERE usuario_id = :user_id AND activo = true
        """)
        docente_result = await session.execute(docente_query, {"user_id": user_id})
        docente_row = docente_result.fetchone()
        
        if not docente_row:
            raise ValueError(f"Perfil de docente no encontrado para usuario {user_id}")
        
        return rol_nombre, docente_row.id
    
    raise ValueError(f"Rol no reconocido: {rol_nombre}")