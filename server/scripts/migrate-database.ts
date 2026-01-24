#!/usr/bin/env node

/**
 * 数据库迁移执行脚本
 * 
 * 使用方法:
 * npm run migrate        # 执行所有迁移
 * npm run migrate:data   # 仅迁移现有数据
 * npm run migrate:validate # 验证迁移结果
 */

import { runMigrations, migrateExistingData, validateMigration } from '../utils/migration';

async function main() {
  const command = process.argv[2] || 'all';
  
  try {
    switch (command) {
      case 'all':
        console.log('🚀 开始完整数据库迁移...');
        
        // 1. 执行结构迁移
        console.log('\n📋 步骤 1: 执行数据库结构迁移');
        await runMigrations();
        
        // 2. 迁移现有数据
        console.log('\n📋 步骤 2: 迁移现有数据');
        await migrateExistingData();
        
        // 3. 验证迁移结果
        console.log('\n📋 步骤 3: 验证迁移结果');
        await validateMigration();
        
        console.log('\n✅ 数据库迁移完成！');
        break;
        
      case 'structure':
        console.log('🚀 执行数据库结构迁移...');
        await runMigrations();
        console.log('✅ 数据库结构迁移完成！');
        break;
        
      case 'data':
        console.log('🚀 迁移现有数据...');
        await migrateExistingData();
        console.log('✅ 数据迁移完成！');
        break;
        
      case 'validate':
        console.log('🚀 验证迁移结果...');
        await validateMigration();
        console.log('✅ 迁移验证通过！');
        break;
        
      default:
        console.log('❌ 未知命令:', command);
        console.log('可用命令: all, structure, data, validate');
        process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.argv[1] === __filename) {
  main();
}

export { main };