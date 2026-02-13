# Replace BullMQ with @nestjs/schedule Cron — Implementation Prompt
## Date: 2026-02-10
## For: Claude Code (Opus 4.6)

---

## 🎯 **OBJECTIVE**

Replace BullMQ dependency with `@nestjs/schedule` cron for recurring invoices to:
- **Save $13-55/month** Azure Cache for Redis cost
- **Simplify architecture** — remove Redis dependency 
- **Maintain functionality** — keep all recurring invoice features working
- **Improve reliability** — simple cron vs complex queue system

---

## 🚨 **CRITICAL: FOLLOW REPUBLICODE METHODOLOGY**

### **1. Plan Mode Default**
- Analyze existing BullMQ implementation BEFORE coding
- Write detailed implementation plan with file-by-file changes
- Identify all touch points and dependencies
- Plan testing strategy upfront

### **2. Analysis Before Coding**
- Read `apps/api/src/modules/recurring-invoices/` completely
- Understand current queue logic, scheduling, and error handling
- Identify what needs to be preserved vs replaced
- Map old BullMQ patterns to new cron patterns

### **3. Verification Before Done**
- Demonstrate that recurring invoices still work (create test template)
- Show that API starts without Redis dependency
- Verify error handling and logging still function
- Provide evidence of completion with screenshots/logs

### **4. Self-Improvement Loop** 
- Document any patterns discovered during implementation
- Note any "lessons learned" that should be added to `tasks/lessons.md`

---

## 📊 **CURRENT STATE ANALYSIS**

Based on project context document:

### **BullMQ Implementation Status**
- ✅ **UI + CRUD Ready**: Recurring invoice templates CRUD exists
- ✅ **Plan Gating**: Feature gated behind PRO plan 
- ⚠️ **BullMQ Conditional**: API starts without Redis (good for this migration!)
- ❌ **BullMQ Replacement Needed**: Switch to simple cron

### **Current Architecture** 
```
RecurringInvoiceModule → BullMQ → Redis Queue → Job Processing
```

### **Target Architecture**
```
RecurringInvoiceModule → @nestjs/schedule Cron → Direct Processing
```

---

## 🛠️ **TECHNICAL REQUIREMENTS**

### **Dependencies**
- `@nestjs/schedule` — ✅ Already installed (confirmed in context doc)
- Remove: `@nestjs/bull`, `bull`, `ioredis` dependencies
- Remove: Redis environment variables and configuration

### **Core Replacement Logic**

**From BullMQ Pattern:**
```typescript
// Old: Queue-based
await this.recurringInvoiceQueue.add('processRecurring', payload, {
  repeat: { cron: '0 1 0 * * *' }
});
```

**To Cron Pattern:**
```typescript
// New: Direct cron
@Cron('0 1 0 * * *', { name: 'processRecurringInvoices' })
async handleRecurringInvoices() {
  // Direct processing logic
}
```

### **Database Query Logic** (Preserve This)
```sql
SELECT * FROM recurring_invoice_templates 
WHERE status = 'ACTIVE' 
  AND nextRunDate <= GETDATE()
  AND consecutiveFailures < 3
```

### **Error Handling Strategy**
- **Success**: Update `nextRunDate` based on interval (daily/weekly/monthly)
- **Failure**: Increment `consecutiveFailures`, log error
- **3+ Failures**: Set status to 'SUSPENDED', notify admin
- **Retry Logic**: Simple immediate retry, no complex queue retry

---

## 📁 **FILES TO MODIFY**

### **1. Remove BullMQ Dependencies**
- `apps/api/package.json` — Remove `@nestjs/bull`, `bull`, `ioredis`
- `apps/api/src/app.module.ts` — Remove BullModule configuration
- `apps/api/src/modules/recurring-invoices/recurring-invoices.module.ts` — Remove queue imports

### **2. Create Cron Service**
- `apps/api/src/modules/recurring-invoices/recurring-invoice-cron.service.ts` — NEW FILE

### **3. Update Module Configuration**
- `apps/api/src/modules/recurring-invoices/recurring-invoices.module.ts` — Add ScheduleModule, register new cron service

### **4. Environment Variables** (Remove Redis)
- Remove `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` from env files
- Update Azure App Service environment variables (document what to remove)

### **5. Docker Configuration**
- `apps/api/Dockerfile` — Remove any Redis-related setup if exists

---

## ⚡ **IMPLEMENTATION PLAN**

### **Phase 1: Analysis & Preparation**
1. **Read Current Implementation**
   - `apps/api/src/modules/recurring-invoices/recurring-invoices.service.ts`
   - `apps/api/src/modules/recurring-invoices/recurring-invoices.module.ts`
   - Any existing queue consumers or producers

2. **Identify Core Logic**
   - How templates are queried (`status = 'ACTIVE'`, `nextRunDate`)
   - How DTEs are created from templates
   - How `nextRunDate` is calculated
   - Error handling and failure counting

### **Phase 2: Create Cron Service**
```typescript
// apps/api/src/modules/recurring-invoices/recurring-invoice-cron.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RecurringInvoicesService } from './recurring-invoices.service';

@Injectable()
export class RecurringInvoiceCronService {
  private readonly logger = new Logger(RecurringInvoiceCronService.name);

  constructor(
    private readonly recurringInvoicesService: RecurringInvoicesService,
  ) {}

  @Cron('0 1 0 * * *', { 
    name: 'processRecurringInvoices',
    timeZone: 'America/El_Salvador' 
  })
  async handleRecurringInvoices() {
    this.logger.log('Starting recurring invoices processing...');
    
    try {
      // Get all active templates due for processing
      const dueTemplates = await this.recurringInvoicesService.getDueTemplates();
      
      this.logger.log(`Found ${dueTemplates.length} templates to process`);
      
      for (const template of dueTemplates) {
        try {
          await this.processTemplate(template);
        } catch (error) {
          this.logger.error(`Failed to process template ${template.id}:`, error);
          await this.handleTemplateError(template, error);
        }
      }
      
      this.logger.log('Recurring invoices processing completed');
    } catch (error) {
      this.logger.error('Fatal error in recurring invoices cron:', error);
    }
  }

  private async processTemplate(template: any) {
    // Generate DTE using existing DTE creation logic
    // Update nextRunDate based on interval
    // Reset consecutiveFailures on success
  }

  private async handleTemplateError(template: any, error: Error) {
    // Increment consecutiveFailures
    // Suspend template if failures >= 3
    // Log error details
  }
}
```

### **Phase 3: Update Module Configuration**
```typescript
// apps/api/src/modules/recurring-invoices/recurring-invoices.module.ts
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { RecurringInvoicesController } from './recurring-invoices.controller';
import { RecurringInvoicesService } from './recurring-invoices.service';
import { RecurringInvoiceCronService } from './recurring-invoice-cron.service'; // NEW

@Module({
  imports: [
    ScheduleModule.forRoot(), // NEW - Enable scheduling
    // Remove: BullModule.registerQueue()
  ],
  controllers: [RecurringInvoicesController],
  providers: [
    RecurringInvoicesService,
    RecurringInvoiceCronService, // NEW
    // Remove: Queue consumers/producers
  ],
})
export class RecurringInvoicesModule {}
```

### **Phase 4: Remove BullMQ Dependencies**
- Update `package.json` to remove queue-related packages
- Remove queue imports from `app.module.ts`
- Clean up any queue-related configuration

### **Phase 5: Environment Variable Cleanup**
- Document which Redis env vars to remove from Azure App Service
- Update any deployment scripts that reference Redis

---

## ✅ **ACCEPTANCE CRITERIA**

### **Functional Requirements**
1. **API Starts Successfully** without Redis dependency
2. **Cron Executes Daily** at 00:01 El Salvador time
3. **Templates Processed** correctly (query active templates due for processing)
4. **DTEs Generated** using existing invoice creation logic
5. **Error Handling** increments failures, suspends after 3 failures
6. **NextRunDate Updated** properly for daily/weekly/monthly intervals

### **Non-Functional Requirements**
1. **Performance** — Processing time under 30 seconds for normal volume
2. **Logging** — Detailed logs for monitoring and debugging
3. **Error Recovery** — Graceful handling of individual template failures
4. **Timezone Handling** — Proper El Salvador timezone for scheduling

### **Technical Requirements**
1. **No Redis Dependencies** — Remove all Redis/BullMQ packages
2. **Clean Module Structure** — Proper separation of concerns
3. **Existing API Compatibility** — Don't break existing recurring invoice CRUD
4. **Plan Gating Preserved** — Feature still gated behind PRO plan

---

## 🧪 **TESTING STRATEGY**

### **Unit Testing**
1. Create test recurring invoice template
2. Verify cron service queries correct templates
3. Test error handling with invalid template
4. Verify nextRunDate calculation logic

### **Integration Testing** 
1. Start API without Redis — should work
2. Create PRO tenant and recurring template
3. Manually trigger cron or wait for scheduled execution
4. Verify DTE is generated and template updated

### **Production Testing**
1. Deploy to Azure without Redis environment variables
2. Monitor logs for cron execution
3. Verify no Redis connection errors
4. Test with real recurring invoice template

---

## 📈 **DEPLOYMENT PLAN**

### **Pre-Deployment**
1. **Remove Redis Env Vars** from Azure App Service configuration:
   - `REDIS_HOST`
   - `REDIS_PORT` 
   - `REDIS_PASSWORD`
   - Any other Redis-related variables

2. **Build New Version**: API v23
```bash
docker build --no-cache -t facturadorsvacr.azurecr.io/facturador-api:v23 -f apps/api/Dockerfile .
az acr login --name facturadorsvacr
docker push facturadorsvacr.azurecr.io/facturador-api:v23
```

### **Deployment**
```bash
az webapp config container set --name facturador-api-sv --resource-group facturador-sv-rg --container-image-name facturadorsvacr.azurecr.io/facturador-api:v23
az webapp restart --name facturador-api-sv --resource-group facturador-sv-rg
```

### **Post-Deployment Verification**
1. Check API health endpoint
2. Verify swagger docs still load
3. Check application logs for cron registration
4. Monitor for next scheduled cron execution

---

## 🚨 **CRITICAL LESSONS TO FOLLOW**

### **Defensive Error Handling**
```typescript
// GOOD - Defensive JSON parsing
try {
  const result = await api.call();
  const data = Array.isArray(result?.data) ? result.data : [];
  // Process data safely
} catch (error) {
  this.logger.error('API call failed:', error);
  // Don't crash, handle gracefully
}
```

### **Proper Logging**
```typescript
// GOOD - Detailed logging for monitoring
this.logger.log(`Processing ${templates.length} recurring templates`);
this.logger.error(`Template ${id} failed after ${attempts} attempts:`, error);
```

### **Database Query Safety**
```typescript
// GOOD - Safe query with proper error handling
const templates = await this.prisma.recurringInvoiceTemplate.findMany({
  where: {
    tenantId,
    status: 'ACTIVE',
    nextRunDate: { lte: new Date() },
    consecutiveFailures: { lt: 3 }
  }
}).catch(error => {
  this.logger.error('Database query failed:', error);
  return [];
});
```

---

## 🎯 **SUCCESS METRICS**

### **Immediate Success** (Deploy Day)
- ✅ API starts without Redis
- ✅ No connection errors in logs
- ✅ Swagger docs load correctly
- ✅ Existing APIs still work

### **Functional Success** (After First Cron Run)
- ✅ Cron executes at scheduled time
- ✅ Templates are queried correctly
- ✅ DTEs are generated successfully
- ✅ NextRunDate is updated properly

### **Business Success** (Ongoing)
- 💰 **$13-55/month saved** in Redis hosting costs
- 🔧 **Simpler maintenance** — no queue management
- 📊 **Same functionality** — users notice no difference
- 🛡️ **Better reliability** — fewer moving parts

---

## 📋 **DELIVERABLES**

When you complete this task, provide:

### **1. Implementation Summary**
- List of files created/modified
- Summary of changes made
- Any deviations from the plan

### **2. Testing Evidence**
- Screenshots of successful API startup
- Logs showing cron registration
- Evidence of recurring invoice processing

### **3. Deployment Instructions**
- Updated environment variable configuration
- Docker build commands used
- Any Azure configuration changes needed

### **4. Documentation Updates**
- Update project context document
- Add any new lessons learned
- Update README if applicable

---

## 🎭 **ANTI-PATTERNS TO AVOID**

### **❌ Don't Break Existing Functionality**
- Keep all CRUD APIs working
- Preserve plan gating logic
- Don't change database schema unnecessarily

### **❌ Don't Over-Engineer** 
- Simple cron is sufficient
- Don't add complex retry mechanisms
- Don't create unnecessary abstractions

### **❌ Don't Skip Error Handling**
- Handle database connection failures
- Catch and log DTE creation errors  
- Don't let one failure break entire cron

### **❌ Don't Forget Timezone**
- Use El Salvador timezone for cron
- Consider daylight saving time changes
- Document timezone assumptions

---

## 🔧 **CURRENT PROJECT CONTEXT**

### **Tech Stack**
- **Backend**: NestJS (Node.js)
- **Database**: Azure SQL Database with Prisma ORM
- **Deployment**: Docker → Azure Container Registry → Azure App Services
- **Current Versions**: API v22, Web v34

### **Azure Resources**
- **Resource Group**: `facturador-sv-rg`
- **API App Service**: `facturador-api-sv`
- **Container Registry**: `facturadorsvacr`
- **Database**: `facturador-sql-sv.database.windows.net/facturadordb`

### **Key Files Location**
- **Recurring Module**: `apps/api/src/modules/recurring-invoices/`
- **Main App Module**: `apps/api/src/app.module.ts`
- **Package.json**: `apps/api/package.json`

---

## ⚡ **GET STARTED**

1. **Read this entire prompt** and understand the objective
2. **Analyze current BullMQ implementation** in recurring-invoices module
3. **Create implementation plan** with specific file changes
4. **Implement the cron service** following the patterns above
5. **Test thoroughly** before marking as complete
6. **Document your changes** and provide evidence

Remember: **Analysis before coding, verification before done!**

---
*Generated: 2026-02-10 for Facturador Electrónico SV — Replace BullMQ with @nestjs/schedule cron*