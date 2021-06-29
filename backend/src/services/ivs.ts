import { ChannelLatencyMode, ChannelType, CreateChannelCommand, IvsClient } from "@aws-sdk/client-ivs";
import { v4 as uuidv4 } from 'uuid';

const client = new IvsClient({region: 'us-east-1'});

export const createChannelCommand = new CreateChannelCommand({
  authorized: false,
  latencyMode: ChannelLatencyMode.NormalLatency,
  name: uuidv4(),
  type: ChannelType.StandardChannelType
})

export default client;