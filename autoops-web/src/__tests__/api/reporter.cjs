// Custom Jest reporter that prints the AUTOOPS API TEST REPORT summary.

const GROUPS = [
  { label: 'AUTH         ', file: 'auth.test.ts' },
  { label: 'CATALOG-PARTS', file: 'catalog.test.ts' },
  { label: 'CLIENTS      ', file: 'clients.test.ts' },
  { label: 'VEHICLES     ', file: 'vehicles.test.ts' },
  { label: 'ORDERS       ', file: 'orders.test.ts' },
  { label: 'USERS        ', file: 'users.test.ts' },
  { label: 'DELETE-IN-USE', file: 'catalog-delete.test.ts' },
];

function idFromTitle(title) {
  // Extracts ids like "AUTH-01", "CAT-PARTS-08", "ORD-15" from titles such as
  // "CAT-PARTS-08 — Get part by id".
  const m = title.match(/^([A-Z]+(?:-[A-Z]+)*-\d+)/);
  return m ? m[1] : title;
}

class AutoopsReporter {
  constructor(globalConfig) {
    this.globalConfig = globalConfig;
    this.startedAt = Date.now();
  }

  onRunStart() {
    this.startedAt = Date.now();
  }

  onRunComplete(_contexts, results) {
    const counts = {};
    const failures = [];

    for (const tr of results.testResults) {
      const group = GROUPS.find((g) => tr.testFilePath.endsWith(g.file));
      if (!group) continue;
      const key = group.label.trim();
      if (!counts[key]) counts[key] = { pass: 0, total: 0 };
      for (const ar of tr.testResults) {
        counts[key].total += 1;
        if (ar.status === 'passed') {
          counts[key].pass += 1;
        } else {
          const id = idFromTitle(ar.title);
          const reason = (ar.failureMessages || []).join('\n').split('\n')[0] || 'failed';
          failures.push({ id, reason });
        }
      }
    }

    const lines = [];
    if (failures.length > 0) {
      for (const f of failures) {
        lines.push(`FAIL ${f.id} — ${f.reason}`);
      }
      lines.push('');
    }

    lines.push('AUTOOPS API TEST REPORT');
    lines.push('=======================');
    let totalPass = 0;
    let totalAll = 0;
    for (const g of GROUPS) {
      const key = g.label.trim();
      const c = counts[key] || { pass: 0, total: 0 };
      totalPass += c.pass;
      totalAll += c.total;
      const ratio = `${c.pass}/${c.total}`.padEnd(6, ' ');
      const status = c.pass === c.total && c.total > 0 ? 'PASS' : 'FAIL';
      lines.push(`${g.label} ${ratio} ${status}`);
    }
    lines.push('-----------------------');
    const totalRatio = `${totalPass}/${totalAll}`.padEnd(6, ' ');
    const totalStatus = totalPass === totalAll && totalAll > 0 ? 'PASS' : 'FAIL';
    lines.push(`TOTAL    ${totalRatio} ${totalStatus}`);
    const duration = ((Date.now() - this.startedAt) / 1000).toFixed(1);
    lines.push(`Duration: ${duration}s`);

    // eslint-disable-next-line no-console
    console.log('\n' + lines.join('\n') + '\n');
  }
}

module.exports = AutoopsReporter;
