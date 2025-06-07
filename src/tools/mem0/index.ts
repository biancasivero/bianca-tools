/**
 * Mem0 Memory Tools Module
 * 
 * Ferramentas para gerenciamento de memória persistente usando SDK oficial
 * API Documentation: https://docs.mem0.ai/
 */

import { MemoryClient } from 'mem0ai';
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
const MEM0_API_KEY = process.env.MEM0_API_KEY || '';
const MEM0_ORG_ID = process.env.MEM0_ORG_ID;
const MEM0_PROJECT_ID = process.env.MEM0_PROJECT_ID;

// Inicializar cliente Mem0
let memoryClient: MemoryClient | null = null;

function getMemoryClient(): MemoryClient {
  if (!memoryClient) {
    if (!MEM0_API_KEY) {
      throw new Error('MEM0_API_KEY é obrigatório para usar as ferramentas de memória');
    }
    
    const clientConfig: any = {
      apiKey: MEM0_API_KEY
    };
    
    if (MEM0_ORG_ID) clientConfig.orgId = MEM0_ORG_ID;
    if (MEM0_PROJECT_ID) clientConfig.projectId = MEM0_PROJECT_ID;
    
    memoryClient = new MemoryClient(clientConfig);
  }
  return memoryClient;
}

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

// Handlers das ferramentas
export async function handleAddMemory(params: AddMemoryParams) {
  const validated = AddMemorySchema.parse(params);
  
  try {
    const client = getMemoryClient();
    
    // Adicionar memória usando SDK oficial
    const messages = [
      { role: 'user' as const, content: validated.content }
    ];
    
    const result = await client.add(messages, {
      user_id: validated.user_id,
      metadata: validated.metadata || {},
      ...(validated.category && { categories: [validated.category] })
    });
    
    // O resultado é um array de objetos
    const memoryData = Array.isArray(result) ? result[0] : result;
    const memoryId = memoryData?.id || 'unknown';
    
    return successResponse(
      {
        id: memoryId,
        content: validated.content,
        user_id: validated.user_id,
        metadata: validated.metadata || {},
        tags: validated.tags || [],
        category: validated.category,
        created_at: new Date().toISOString(),
        mode: 'api'
      },
      `✅ Memória adicionada com sucesso (ID: ${memoryId}) - SDK Oficial`
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
    const client = getMemoryClient();
    
    // Buscar memórias usando SDK oficial
    const filters = {
      user_id: validated.user_id,
      ...validated.filters
    };
    
    const result = await client.search(validated.query, {
      filters: filters,
      limit: validated.limit
    });
    
    return successResponse(
      {
        results: result || [],
        total: (result || []).length,
        query: validated.query,
        user_id: validated.user_id,
        mode: 'api'
      },
      `Encontradas ${(result || []).length} memórias para "${validated.query}" - SDK Oficial`
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
    const client = getMemoryClient();
    
    // Listar memórias usando SDK oficial
    const result = await client.getAll({
      user_id: validated.user_id,
      limit: validated.limit
    });
    
    return successResponse(
      {
        memories: result || [],
        total: (result || []).length,
        user_id: validated.user_id,
        mode: 'api'
      },
      `Total de ${(result || []).length} memórias encontradas - SDK Oficial`
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
    const client = getMemoryClient();
    
    if (validated.memory_id) {
      // Deletar memória específica
      await client.delete(validated.memory_id);
      
      return successResponse(
        {
          deleted: true,
          memory_id: validated.memory_id,
          user_id: validated.user_id,
          deleted_count: 1,
          mode: 'api'
        },
        `Memória ${validated.memory_id} deletada com sucesso - SDK Oficial`
      );
    } else {
      // Deletar todas as memórias do usuário
      const memories = await client.getAll({ user_id: validated.user_id });
      let deletedCount = 0;
      
      if (memories && Array.isArray(memories)) {
        for (const memory of memories) {
          try {
            await client.delete(memory.id);
            deletedCount++;
          } catch (error) {
            console.warn(`Erro ao deletar memória ${memory.id}:`, error);
          }
        }
      }
      
      return successResponse(
        {
          deleted: true,
          user_id: validated.user_id,
          deleted_count: deletedCount,
          mode: 'api'
        },
        `${deletedCount} memórias do usuário ${validated.user_id} foram deletadas - SDK Oficial`
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
    description: 'Adiciona uma nova memória ao sistema de memória persistente usando SDK oficial',
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
    description: 'Busca memórias usando pesquisa semântica com SDK oficial',
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
    description: 'Lista todas as memórias armazenadas para um usuário usando SDK oficial',
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
    description: 'Remove memórias do sistema usando SDK oficial',
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