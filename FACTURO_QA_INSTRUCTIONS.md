# 🔍 FACTURO QA COMPREHENSIVE TESTING INSTRUCTIONS
**For Claude Code - Enterprise QA Level Testing**
**Platform: Facturador Electrónico SV - API v29 + Web v39**

## 🎯 ROLE DEFINITION
You are a **Senior QA Engineer** with 10+ years of experience testing enterprise SaaS platforms. Your mission is to perform comprehensive testing of Facturador Electrónico SV with the highest quality standards. Report every bug, UX issue, performance concern, and improvement opportunity you find.

## 📋 TESTING ENVIRONMENT
- **Production URL**: https://facturador-web-sv.azurewebsites.net
- **API Base**: https://facturador-api-sv.azurewebsites.net
- **Expected User**: facturas@republicode.com (Tenant: Republicode S.A. de C.V.)
- **Current State**: All features should be functional, API v29 deployed
- **Testing Device**: Desktop + Mobile simulation

## 🧪 COMPREHENSIVE TEST PLAN

### **PHASE 1: AUTHENTICATION & SECURITY**
#### Test Cases:
1. **Login Flow**
   - Valid credentials acceptance
   - Invalid credentials rejection
   - Password field masking
   - Remember me functionality
   - Session timeout behavior
   - Logout functionality

2. **Security Testing**
   - JWT token handling
   - Route protection (unauthorized access)
   - CSRF protection
   - XSS vulnerability scanning
   - SQL injection attempts on forms

3. **User Session Management**
   - Multi-tab behavior
   - Session persistence
   - Automatic logout timing
   - Token refresh mechanisms

**Report Format:**
```
✅ PASS: Feature works correctly
❌ FAIL: [Bug description] - Steps to reproduce
⚠️ ISSUE: [UX/Performance concern] - Impact level
💡 IMPROVEMENT: [Suggestion] - Business value
```

---

### **PHASE 2: CORE PLATFORM TESTING**

#### **2A. DASHBOARD & NAVIGATION**
1. **Main Dashboard**
   - Loading performance (< 3 seconds)
   - All widgets display data correctly
   - Responsive design (desktop/tablet/mobile)
   - Navigation menu functionality
   - User profile information accuracy

2. **Performance Metrics**
   - Page load times
   - API response times
   - Memory usage patterns
   - Network request optimization

#### **2B. CLIENTES (CUSTOMER MANAGEMENT)**
1. **List View**
   - Pagination functionality (expected: 355+ clients)
   - Search functionality
   - Sorting by different columns
   - Filter options
   - Export capabilities

2. **CRUD Operations**
   - Create new client (full form validation)
   - Edit existing client
   - Delete client (with confirmations)
   - Bulk operations

3. **Data Validation**
   - NIT format validation (El Salvador standards)
   - Email format validation
   - Phone number validation
   - Required field enforcement
   - Duplicate prevention

#### **2C. PRODUCTOS/SERVICIOS (CATALOG)**
1. **Product Management**
   - Add new products/services
   - Edit existing items
   - Price management
   - Category organization
   - Inventory tracking

2. **Integration Testing**
   - Product selection in invoices
   - Price propagation accuracy
   - Tax calculation correctness
   - Discount application

---

### **PHASE 3: FACTURACIÓN ELECTRÓNICA (CORE BUSINESS)**

#### **3A. INVOICE CREATION**
1. **Form Functionality**
   - Client selection (autocomplete)
   - Product/service selection
   - Quantity and price calculations
   - Tax calculations (IVA El Salvador 13%)
   - Discount applications
   - Totals accuracy

2. **DTE Integration**
   - Document type selection (Factura, CCF, etc.)
   - Ministerio de Hacienda transmission
   - Digital signature (JWS) generation
   - Error handling for failed transmissions
   - Retry mechanisms

3. **Invoice Types Testing**
   - Consumer invoices (B2C)
   - Business credit vouchers (B2B)
   - Credit notes
   - Debit notes
   - Export documents

#### **3B. INVOICE MANAGEMENT**
1. **List and Search**
   - Invoice history display
   - Status indicators (Pending, Sent, Paid, etc.)
   - Search by number, client, date
   - Filter by status, type, period

2. **Invoice Operations**
   - Print/PDF generation
   - Email delivery
   - Void/cancel invoices
   - Payment recording

---

### **PHASE 4: CONTABILIDAD (ACCOUNTING MODULE)**

#### **4A. Chart of Accounts**
1. **Account Structure**
   - Default 105 accounts verification
   - NIIF/PYMES El Salvador compliance
   - Account hierarchy display
   - Add/edit accounts functionality

2. **Journal Entries**
   - Manual entry creation
   - Automatic entries from invoices
   - Entry validation (balanced debits/credits)
   - Posting and void processes

#### **4B. Financial Reports**
1. **Standard Reports**
   - Trial Balance accuracy
   - Balance Sheet generation
   - Income Statement calculation
   - General Ledger detail

2. **Report Features**
   - Date range selection
   - Export to PDF/Excel
   - Print formatting
   - Data accuracy verification

3. **Accounting Dashboard**
   - Real-time metrics display
   - Chart visualizations
   - KPI calculations
   - Performance indicators

---

### **PHASE 5: COTIZACIONES ADVANCED ⭐ (NEW FEATURE)**

#### **5A. Quote Management (Admin Side)**
1. **Quote Creation**
   - Form validation and UX
   - Client selection
   - Line item management
   - Pricing calculations
   - Save as draft functionality

2. **Quote Versioning**
   - Version control system
   - Previous version access
   - Change tracking
   - Approval workflow

3. **Quote List Management**
   - Display all quotes correctly
   - Status filtering (Draft, Sent, Approved, etc.)
   - Search functionality
   - Bulk operations

#### **5B. Public Approval Portal (CLIENT SIDE)**
1. **Access Testing**
   - URL generation correctness
   - No-login access verification
   - Token validation security
   - Expiration handling

2. **Client Interface**
   - Mobile responsiveness
   - Quote details display
   - Line item approval/rejection
   - Rejection reason input
   - Partial approval functionality

3. **Approval Workflow**
   - Individual item approval
   - Quantity modifications
   - Status updates in real-time
   - Notification systems

#### **5C. Integration Testing**
1. **Quote to Invoice Conversion**
   - Approved quotes conversion
   - Data integrity preservation
   - Automatic accounting entries
   - Status synchronization

2. **Email Integration**
   - Approval link generation
   - Email delivery confirmation
   - Reminder system
   - Template customization

---

### **PHASE 6: RECURRENTES (RECURRING BILLING)**
1. **Subscription Setup**
   - Recurring billing configuration
   - Schedule management
   - Client assignment
   - Service/product selection

2. **Automation Testing**
   - Automatic invoice generation
   - Billing cycle accuracy
   - Payment processing integration
   - Failure handling

---

### **PHASE 7: REPORTES & ANALYTICS**
1. **Business Reports**
   - Sales reports accuracy
   - Period comparisons
   - Client analysis
   - Product performance

2. **Export Functionality**
   - PDF generation quality
   - Excel export completeness
   - Data formatting consistency

---

### **PHASE 8: MOBILE & RESPONSIVE TESTING**
1. **Mobile Experience**
   - All pages responsive design
   - Touch interface optimization
   - Form usability on mobile
   - Navigation accessibility

2. **Cross-Browser Testing**
   - Chrome compatibility
   - Firefox compatibility
   - Safari compatibility (if applicable)
   - Edge compatibility

---

### **PHASE 9: PERFORMANCE & SECURITY**
1. **Performance Testing**
   - Page load speed analysis
   - API response time measurement
   - Large dataset handling
   - Concurrent user simulation

2. **Security Assessment**
   - Input validation testing
   - Authentication bypass attempts
   - Authorization verification
   - Data exposure assessment

---

## 📊 REPORTING REQUIREMENTS

### **Bug Report Template**
```
🐛 BUG REPORT #[NUMBER]
**Severity**: Critical/High/Medium/Low
**Module**: [Affected area]
**Description**: [Clear problem description]
**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Expected vs Actual result]

**Environment**: Browser, OS, Screen size
**Impact**: Business/User impact description
**Workaround**: If available
```

### **UX/Performance Issues Template**
```
⚠️ UX ISSUE #[NUMBER]
**Type**: Performance/Usability/Accessibility
**Location**: [Specific page/feature]
**Description**: [Issue description]
**User Impact**: [How it affects users]
**Recommendation**: [Suggested improvement]
**Priority**: High/Medium/Low
```

### **Improvement Suggestions Template**
```
💡 ENHANCEMENT #[NUMBER]
**Category**: Feature/UX/Performance/Security
**Current State**: [How it works now]
**Proposed Enhancement**: [Detailed suggestion]
**Business Value**: [Why this matters]
**Implementation Effort**: [Estimated complexity]
```

---

## 🎯 SUCCESS CRITERIA

### **Functional Requirements**
- [ ] All CRUD operations work flawlessly
- [ ] DTE integration with Ministerio Hacienda functional
- [ ] Accounting calculations accurate to 2 decimals
- [ ] Quote approval workflow complete end-to-end
- [ ] All reports generate correct data

### **Performance Requirements**
- [ ] Page loads < 3 seconds on standard connection
- [ ] API responses < 2 seconds for standard queries
- [ ] Mobile pages load < 5 seconds on 3G
- [ ] Large datasets (1000+ records) handle smoothly

### **Security Requirements**
- [ ] No unauthorized access possible
- [ ] All forms protected against XSS/SQL injection
- [ ] Sensitive data properly encrypted
- [ ] Session management secure

### **UX Requirements**
- [ ] Mobile-first design functional
- [ ] Intuitive navigation flow
- [ ] Clear error messages
- [ ] Consistent design system

---

## 📝 TESTING EXECUTION INSTRUCTIONS

### **Testing Order**
1. Start with Authentication (critical path)
2. Test core business functions (invoicing)
3. Test supporting modules (clients, products)
4. Test new features (quotations)
5. Test integration points
6. Test edge cases and error scenarios
7. Perform security and performance testing

### **Documentation Requirements**
- Screenshot evidence for each bug
- Performance metrics screenshots
- Mobile testing screenshots
- Network tab evidence for API issues
- Console error logs for technical issues

### **Testing Environment Setup**
- Use Chrome DevTools for performance analysis
- Enable network throttling for mobile testing
- Test with different screen sizes (320px, 768px, 1024px, 1920px)
- Clear cache between major test phases
- Test with both fresh and cached sessions

---

## 🚀 DELIVERABLE

**Expected Output**: Comprehensive QA report with:
- Executive summary of platform stability
- Detailed bug list with priorities
- Performance benchmarks
- Security assessment summary
- UX improvement recommendations
- Mobile readiness assessment
- Business-critical issue highlights
- Recommended fix timeline

**Quality Standard**: Enterprise-grade SaaS platform ready for 1000+ concurrent users with zero data integrity issues and 99.9% uptime capability.

**Testing Duration**: Plan for 4-6 hours of comprehensive testing to cover all modules and scenarios thoroughly.

---

## 📋 FINAL VALIDATION

Before concluding, verify:
- [ ] All core business processes tested
- [ ] Critical user journeys validated
- [ ] Performance meets requirements
- [ ] Security posture assessed
- [ ] Mobile experience verified
- [ ] Integration points validated
- [ ] Error handling tested
- [ ] Data accuracy confirmed

**Remember**: You represent the voice of the customer and the quality gatekeeper. Be thorough, be critical, and help make Facturador Electrónico SV the most reliable electronic invoicing platform in El Salvador.
