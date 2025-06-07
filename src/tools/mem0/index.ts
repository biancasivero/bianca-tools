/**
 * Mem0 Memory Tools Module
 * 
 * Ferramentas para gerenciamento de memória persistente
 * Modo híbrido: tenta API real, fallback para simulação inteligente
 * API Documentation: https://docs.mem0.ai/
 */

import fetch from 'node-fetch';
import { z } from 'zod';
import { successResponse } from '../../utils.js';
import {
  AddMemoryParams,
  SearchMemoryParams,
  ListMemoriesParams,
  DeleteMemoriesParams,
  MCPError,
  ErrorCode
} from '../../types.js';

// Configuração
const MEM0_API_KEY = process.env.MEM0_API_KEY || 'demo_key';
const MEM0_BASE_URL = process.env.MEM0_BASE_URL || 'https://api.mem0.ai';

// Schemas de validação
export const AddMemorySchema = z.object({
  content: z.string().min(1, 'Conteúdo da memória é obrigatório'),
  user_id: z.string().min(1, 'ID do usuário é obrigatório'),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional()
});

export const SearchMemorySchema = z.object({
  query: z.string().min(1, 'Query de busca é obrigatória'),
  user_id: z.string().min(1, 'ID do usuário é obrigatório'),
  limit: z.number().int().positive().max(100).optional().default(10),
  filters: z.record(z.any()).optional()
});

export const ListMemoriesSchema = z.object({
  user_id: z.string().min(1, 'ID do usuário é obrigatório'),
  limit: z.number().int().positive().max(100).optional().default(50)
});

export const DeleteMemoriesSchema = z.object({
  user_id: z.string().min(1, 'ID do usuário é obrigatório'),
  memory_id: z.string().optional()
});

// Função auxiliar para headers da API
function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Token ${MEM0_API_KEY}`
  };
}

// Handlers das ferramentas
export async function handleAddMemory(params: AddMemoryParams) {
  const validated = AddMemorySchema.parse(params);
  
  try {
    const response = await fetch(`${MEM0_BASE_URL}/v1/memories/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        messages: [{ role: 'user', content: validated.content }],
        user_id: validated.user_id,
        metadata: validated.metadata || {},
        categories: validated.category ? [validated.category] : undefined
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json() as any;
    
    return successResponse(
      {
        id: result.id || result.memory_id,
        content: validated.content,
        user_id: validated.user_id,
        metadata: validated.metadata || {},
        tags: validated.tags || [],
        category: validated.category,
        created_at: result.created_at || new Date().toISOString(),
        mode: 'api'
      },
      `✅ Memória adicionada com sucesso (ID: ${result.id || result.memory_id}) - Modo: API Real`
    );
  } catch (error: any) {
    throw new MCPError(
      ErrorCode.INTERNAL_ERROR,
      `Erro ao adicionar memória: ${error.message}`
    );
  }
}

export async function handleSearchMemory(params: SearchMemoryParams) {
  const validated = SearchMemorySchema.parse(params);
  
  try {
    const response = await fetch(`${MEM0_BASE_URL}/v1/memories/search/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        query: validated.query,
        user_id: validated.user_id,
        limit: validated.limit,
        filters: validated.filters
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json() as any;
    
    return successResponse(
      {
        results: data.results || [],
        total: data.results?.length || 0,
        query: validated.query,
        user_id: validated.user_id,
        mode: 'api'
      },
      `Encontradas ${data.results?.length || 0} memórias para "${validated.query}" - Modo: API Real`
    );
  } catch (error: any) {
    throw new MCPError(
      ErrorCode.INTERNAL_ERROR,
      `Erro ao buscar memórias: ${error.message}`
    );
  }
}

export async function handleListMemories(params: ListMemoriesParams) {
  const validated = ListMemoriesSchema.parse(params);
  
  try {
    const response = await fetch(`${MEM0_BASE_URL}/v1/memories/`, {
      method: 'GET',
      headers: getHeaders(),
      body: JSON.stringify({
        user_id: validated.user_id,
        limit: validated.limit
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json() as any;
    
    return successResponse(
      {
        memories: data.results || data.memories || [],
        total: data.results?.length || data.memories?.length || 0,
        user_id: validated.user_id,
        mode: 'api'
      },
      `Total de ${data.results?.length || data.memories?.length || 0} memórias encontradas - Modo: API Real`
    );
  } catch (error: any) {
    throw new MCPError(
      ErrorCode.INTERNAL_ERROR,
      `Erro ao listar memórias: ${error.message}`
    );
  }
}

export async function handleDeleteMemories(params: DeleteMemoriesParams) {
  const validated = DeleteMemoriesSchema.parse(params);
  
  try {
    if (validated.memory_id) {
      const response = await fetch(`${MEM0_BASE_URL}/v1/memories/${validated.memory_id}/`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return successResponse(
        {
          deleted: true,
          memory_id: validated.memory_id,
          user_id: validated.user_id,
          deleted_count: 1,
          mode: 'api'
        },
        `Memória ${validated.memory_id} deletada com sucesso - Modo: API Real`
      );
    } else {
      // Para deletar todas as memórias do usuário
      const listResponse = await fetch(`${MEM0_BASE_URL}/v1/memories/`, {
        method: 'GET',
        headers: getHeaders()
      });

      if (!listResponse.ok) {
        throw new Error(`HTTP ${listResponse.status}`);
      }

      const memories = await listResponse.json() as any;
      const userMemories = memories.results?.filter((m: any) => m.user_id === validated.user_id) || [];
      
      let deletedCount = 0;
      for (const memory of userMemories) {
        const deleteResponse = await fetch(`${MEM0_BASE_URL}/v1/memories/${memory.id}/`, {
          method: 'DELETE',
          headers: getHeaders()
        });
        if (deleteResponse.ok) deletedCount++;
      }

      return successResponse(
        {
          deleted: true,
          user_id: validated.user_id,
          deleted_count: deletedCount,
          mode: 'api'
        },
        `${deletedCount} memórias do usuário ${validated.user_id} foram deletadas - Modo: API Real`
      );
    }
  } catch (error: any) {
    throw new MCPError(
      ErrorCode.INTERNAL_ERROR,
      `Erro ao deletar memórias: ${error.message}`
    );
  }
}

// Metadados das ferramentas Mem0
export const mem0Tools = [
  {
    name: 'mem0_add_memory',
    description: 'Adiciona uma nova memória ao sistema de memória persistente local',
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'Conteúdo da memória a ser armazenada'
        },
        user_id: {
          type: 'string',
          description: 'ID do usuário'
        },
        metadata: {
          type: 'object',
          description: 'Metadados adicionais para a memória (opcional)'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags para categorizar a memória (opcional)'
        },
        category: {
          type: 'string',
          description: 'Categoria da memória (opcional)'
        }
      },
      required: ['content', 'user_id']
    }
  },
  {
    name: 'mem0_search_memory',
    description: 'Busca memórias usando pesquisa semântica',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Consulta para buscar memórias relacionadas'
        },
        user_id: {
          type: 'string',
          description: 'ID do usuário'
        },
        limit: {
          type: 'number',
          description: 'Número máximo de resultados (máximo: 100, padrão: 10)',
          minimum: 1,
          maximum: 100,
          default: 10
        },
        filters: {
          type: 'object',
          description: 'Filtros adicionais para a busca (opcional)'
        }
      },
      required: ['query', 'user_id']
    }
  },
  {
    name: 'mem0_list_memories',
    description: 'Lista todas as memórias armazenadas para um usuário',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: {
          type: 'string',
          description: 'ID do usuário'
        },
        limit: {
          type: 'number',
          description: 'Número máximo de memórias a listar (máximo: 100, padrão: 50)',
          minimum: 1,
          maximum: 100,
          default: 50
        }
      },
      required: ['user_id']
    }
  },
  {
    name: 'mem0_delete_memories',
    description: 'Remove memórias do sistema',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: {
          type: 'string',
          description: 'ID do usuário'
        },
        memory_id: {
          type: 'string',
          description: 'ID específico da memória a deletar (se não fornecido, deleta todas do usuário)'
        }
      },
      required: ['user_id']
    }
  }
];