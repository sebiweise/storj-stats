import axios from 'axios';
import { NextResponse } from 'next/server';

interface ReponseData extends NodeData {
    nodesOnline: number,
    totalNodesCount: number,
    nodeList: NodeInformation[]
}

interface NodeInformation extends NodeData {
    nodeID: string,
    wallet: string,
    version: string,
    allowedVersion: string,
    upToDate: boolean,
    configuredPort: string,
    quicStatus: string,
}

interface NodeData {
    egress: string,
    estimatedPayoutToday: number,
    estimatedPayoutTotal: number,
    ingress: string,
    spaceAvailable: number,
    spaceUsed: number,
    spaceTrash: number,
}

function formatDecimal(value: number, decimals: number = 2) {
    return Number(value.toFixed(decimals));
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const nodeList = searchParams.get('nodeList');

        const nodes = nodeList ? nodeList.split(',') : process.env.NODES_LIST?.split(',');

        if (nodes) {
            let body: ReponseData = {
                egress: "0 GB",
                estimatedPayoutToday: 0,
                estimatedPayoutTotal: 0,
                ingress: "0 GB",
                spaceAvailable: 0,
                spaceUsed: 0,
                spaceTrash: 0,
                nodesOnline: 0,
                totalNodesCount: nodes.length,
                nodeList: [],
            }

            for (let index = 0; index < nodes.length; index++) {
                const host = nodes[index];

                const { data: snoResponse } = await axios.get(`${host}/api/sno`);
                const { data: satellitesResponse } = await axios.get(`${host}/api/sno/satellites`);
                const { data: payoutResponse } = await axios.get(`${host}/api/sno/estimated-payout`);

                const node: NodeInformation = {
                    nodeID: snoResponse.nodeID,
                    wallet: snoResponse.wallet,
                    version: snoResponse.version,
                    allowedVersion: snoResponse.allowedVersion,
                    upToDate: snoResponse.upToDate,
                    configuredPort: snoResponse.configuredPort,
                    quicStatus: snoResponse.quicStatus,
                    egress: "0 GB",
                    estimatedPayoutToday: 0,
                    ingress: "0 GB",
                    spaceAvailable: formatDecimal(snoResponse.diskSpace.available / 1000000000000),
                    spaceUsed: formatDecimal(snoResponse.diskSpace.used / 1000000000000),
                    spaceTrash: formatDecimal(snoResponse.diskSpace.trash / 1000000000000),
                    estimatedPayoutTotal: formatDecimal((
                        payoutResponse.currentMonth.egressBandwidthPayout +
                        payoutResponse.currentMonth.egressRepairAuditPayout +
                        payoutResponse.currentMonth.diskSpacePayout
                    ) / 100),
                }

                body.nodeList.push(node);
                body.spaceAvailable += node.spaceAvailable;
                body.spaceUsed += node.spaceUsed;
                body.spaceTrash += node.spaceTrash;
                body.estimatedPayoutTotal += node.estimatedPayoutTotal;
                body.nodesOnline++;
            };

            return NextResponse.json(
                body,
                { status: 200 }
            );
        } else {
            throw Error('No nodes defined!')
        }
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: 'Failed to fetch data' },
            { status: 500 }
        );
    }
}