import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_BRANDS = [
  'Tenda',
  'Huawei',
  'TP-Link',
  'MikroTik',
  'ZTE',
  'Ubiquiti',
  'D-Link',
  'Netgear',
];

const SAMPLE_ROUTERS = [
  {
    mac: '00:1A:2B:3C:4D:5E',
    brandName: 'MikroTik',
    model: 'hEX S (RB760iGS)',
    serial: 'SN-MTK-98231',
    locationName: 'Kasarani, Mwiki Estate, Block C',
    landmark: 'Behind Total Energies, 2nd Floor Unit 4',
    status: 'Active',
    notes: 'Fiber drop from pole #14. PPPoE client configured.',
  },
  {
    mac: 'E4:8D:8C:11:22:33',
    brandName: 'Huawei',
    model: 'OptiXstar HG8145V5',
    serial: 'HW-ONT-45120',
    locationName: 'Westlands, Rhapta Road, Villa 4',
    landmark: 'Near Shell Station, Main Gate intercom',
    status: 'Active',
    notes: 'ONU signal level -19.4 dBm. GPON OK.',
  },
  {
    mac: '50:D4:F7:AA:BB:CC',
    brandName: 'TP-Link',
    model: 'Archer C6 Gigabit',
    serial: 'TPL-8941-XYZ',
    locationName: 'Kilimani, Argwings Kodhek, Apt 12B',
    landmark: 'Green Towers, 3rd Floor',
    status: 'Inactive',
    notes: 'Tenant moved out on 1st of the month. Awaiting new subscription.',
  },
  {
    mac: 'D8:07:B6:33:44:55',
    brandName: 'Tenda',
    model: 'F3 300Mbps',
    serial: 'TND-2023-991',
    locationName: 'Roysambu, Lumumba Drive, Plot 42',
    landmark: 'Next to Quickmart, Gate B Room 10',
    status: 'Faulty',
    notes: 'Power surge damaged WAN port. Needs technician swap.',
  },
  {
    mac: '74:83:C2:55:66:77',
    brandName: 'Ubiquiti',
    model: 'UniFi 6 Lite AP',
    serial: 'UBNT-U6L-778',
    locationName: 'Upper Hill, Hospital Road, Floor 5',
    landmark: 'Corporate Hub, Server Room Rack 2',
    status: 'Active',
    notes: 'PoE powered from switch port 8. Adopted on controller.',
  },
  {
    mac: 'A0:F3:C1:88:99:00',
    brandName: 'ZTE',
    model: 'ZXHN F660',
    serial: 'ZTE-F660-332',
    locationName: 'Kasarani, Clay City, House 18',
    landmark: 'Opposite primary school',
    status: 'Active',
    notes: 'Standard residential install.',
  }
];

async function main() {
  console.log('Seeding Redium database...');

  // Create or retrieve default demo user
  const email = 'demo@redium.isp';
  const passwordHash = await bcrypt.hash('password123', 10);

  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Field Technician',
        email,
        passwordHash,
      },
    });
    console.log(`Created demo user: ${email} / password123`);
  }

  // Create default brands for this user
  const brandMap = {};
  for (const name of DEFAULT_BRANDS) {
    let brand = await prisma.brand.findFirst({
      where: { name, userId: user.id },
    });

    if (!brand) {
      brand = await prisma.brand.create({
        data: {
          name,
          userId: user.id,
        },
      });
      console.log(`Created brand: ${name}`);
    }
    brandMap[name] = brand.id;
  }

  // Seed sample routers if none exist
  const existingRoutersCount = await prisma.router.count({
    where: { userId: user.id },
  });

  if (existingRoutersCount === 0) {
    for (const item of SAMPLE_ROUTERS) {
      const brandId = brandMap[item.brandName];
      if (brandId) {
        await prisma.router.create({
          data: {
            userId: user.id,
            mac: item.mac.replace(/[^0-9A-Fa-f]/g, '').toUpperCase(),
            brandId,
            model: item.model,
            serial: item.serial,
            locationName: item.locationName,
            landmark: item.landmark,
            status: item.status,
            notes: item.notes,
          },
        });
      }
    }
    console.log(`Seeded ${SAMPLE_ROUTERS.length} sample routers.`);
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
