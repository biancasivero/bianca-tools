import { describe, it, expect, jest } from '@jest/globals';
import {
  withRetry,
  withTimeout,
  toResult,
  successResponse,
  errorResponse,
  sleep,
  SimpleCache,
  pipe,
  compose,
  batchProcess
} from '../utils.js';
import { ErrorCode, MCPError } from '../types.js';

describe('Utils', () => {
  describe('withRetry', () => {
    it('deve executar função com sucesso na primeira tentativa', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await withRetry(fn);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('deve tentar novamente em caso de erro', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Erro 1'))
        .mockRejectedValueOnce(new Error('Erro 2'))
        .mockResolvedValue('success');
      
      const result = await withRetry(fn, { retries: 3, delay: 10 });
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('deve falhar após esgotar tentativas', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Erro persistente'));
      
      await expect(withRetry(fn, { retries: 2, delay: 10 }))
        .rejects.toThrow('Erro persistente');
      
      expect(fn).toHaveBeenCalledTimes(3); // 1 inicial + 2 retries
    });
  });

  describe('withTimeout', () => {
    it('deve completar antes do timeout', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await withTimeout(fn, 1000);
      
      expect(result).toBe('success');
    });

    it('deve lançar erro de timeout', async () => {
      const fn = jest.fn().mockImplementation(() => sleep(1000));
      
      await expect(withTimeout(fn, 100))
        .rejects.toThrow(MCPError);
    });
  });

  describe('toResult', () => {
    it('deve retornar Result com sucesso', async () => {
      const fn = jest.fn().mockResolvedValue('value');
      const result = await toResult(fn);
      
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('value');
      }
    });

    it('deve retornar Result com erro', async () => {
      const error = new Error('Test error');
      const fn = jest.fn().mockRejectedValue(error);
      const result = await toResult(fn);
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe(error);
      }
    });
  });

  describe('Response Helpers', () => {
    it('successResponse deve formatar resposta corretamente', () => {
      const result = successResponse({ id: 1 }, 'Operação bem-sucedida');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: 1 });
      expect(result.content).toHaveLength(2);
      expect(result.content[0].text).toBe('Operação bem-sucedida');
    });

    it('errorResponse deve formatar erro corretamente', () => {
      const result = errorResponse(
        ErrorCode.INVALID_PARAMS,
        'Parâmetros inválidos'
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(MCPError);
      expect(result.error.code).toBe(ErrorCode.INVALID_PARAMS);
      expect(result.content[0].text).toBe('Error: Parâmetros inválidos');
    });
  });

  describe('Functional Helpers', () => {
    it('pipe deve executar funções em sequência', () => {
      const add1 = (x: number) => x + 1;
      const mult2 = (x: number) => x * 2;
      const toString = (x: number) => x.toString();
      
      const result = pipe(5, add1, mult2, toString);
      expect(result).toBe('12'); // (5 + 1) * 2 = 12
    });

    it('compose deve executar funções da direita para esquerda', () => {
      const add1 = (x: number) => x + 1;
      const mult2 = (x: number) => x * 2;
      
      const composed = compose<number, number>(add1, mult2);
      const result = composed(5);
      expect(result).toBe(11); // (5 * 2) + 1 = 11
    });
  });

  describe('SimpleCache', () => {
    it('deve armazenar e retornar valores em cache', async () => {
      const cache = new SimpleCache<string>(1000);
      const compute = jest.fn().mockResolvedValue('computed');
      
      const result1 = await cache.getOrCompute('key', compute);
      const result2 = await cache.getOrCompute('key', compute);
      
      expect(result1).toBe('computed');
      expect(result2).toBe('computed');
      expect(compute).toHaveBeenCalledTimes(1);
    });

    it('deve recomputar após TTL expirar', async () => {
      const cache = new SimpleCache<string>(50);
      const compute = jest.fn()
        .mockResolvedValueOnce('value1')
        .mockResolvedValueOnce('value2');
      
      const result1 = await cache.getOrCompute('key', compute);
      await sleep(100);
      const result2 = await cache.getOrCompute('key', compute);
      
      expect(result1).toBe('value1');
      expect(result2).toBe('value2');
      expect(compute).toHaveBeenCalledTimes(2);
    });
  });

  describe('batchProcess', () => {
    it('deve processar items em lotes', async () => {
      const items = [1, 2, 3, 4, 5];
      const processor = jest.fn().mockImplementation(async (x: number) => x * 2);
      
      const results = await batchProcess(items, 2, processor);
      
      expect(results).toEqual([2, 4, 6, 8, 10]);
      expect(processor).toHaveBeenCalledTimes(5);
    });
  });
});