import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Upload } from "lucide-react";
import { DOMAINS } from "../data/domains";
import { GRAPH_DATA } from "../data/network-model-data";
import DomainGraphCanvas from "../components/network-model/DomainGraphCanvas";
import NetworkModelLeftPanel from "../components/network-model/NetworkModelLeftPanel";

type ValidDomain = "ip-core" | "cxi" | "volte";
const VALID_DOMAINS: ValidDomain[] = ["ip-core", "cxi", "volte"];

function isValidDomain(id: string | undefined): id is ValidDomain {
  return VALID_DOMAINS.includes(id as ValidDomain);
}

export default function NetworkModelGraph() {
  const { domainId } = useParams<{ domainId: string }>();
  const navigate     = useNavigate();

  useEffect(() => {
    if (!isValidDomain(domainId)) {
      navigate("/network-model");
    }
  }, [domainId, navigate]);

  if (!isValidDomain(domainId)) return null;

  const domain = DOMAINS[domainId];
  const data   = GRAPH_DATA[domainId];

  function handleNodeSelect(nodeId: string, domain: string) {
    // TODO: Node detail panel is a next-phase task; behavior will be designed
    // per-domain (IP Core vs CXI vs Volte). Wired and ready — no UI action yet.
    console.log("[NetworkModel] node selected:", nodeId, "domain:", domain);
  }

  return (
    <div style={{
      display:  "flex",
      flexDirection: "row",
      height:   "calc(100vh - 116px)",
      margin:   "-16px -24px",
      overflow: "hidden",
    }}>
      {/* Left panel */}
      <NetworkModelLeftPanel
        domainId={domainId}
        onBack={() => navigate("/network-model")}
        onNewConversation={() => navigate(`/network-model/${domainId}/chat`)}
        onSelectConversation={convId => navigate(`/network-model/${domainId}/chat/${convId}`)}
      />

      {/* Right: toolbar + graph */}
      <div style={{
        display:   "flex",
        flexDirection: "column",
        flex:      1,
        minWidth:  0,
        position:  "relative",
        borderLeft: "1px solid var(--color-border)",
      }}>
        {/* Toolbar */}
        <div style={{
          height:      48,
          flexShrink:  0,
          background:  "var(--color-bg-card)",
          borderBottom: "1px solid var(--color-border)",
          display:     "flex",
          alignItems:  "center",
          gap:         8,
          padding:     "0 16px",
        }}>
          {/* Domain label */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, flex: 1 }}>
            <span style={{
              width:        8,
              height:       8,
              borderRadius: "50%",
              background:   domain.color,
              flexShrink:   0,
            }} />
            <span style={{
              fontSize:   13,
              fontWeight: 600,
              color:      "var(--color-text-primary)",
            }}>
              {domain.label}
            </span>
          </div>

          {/* Upload documents */}
          <button style={{
            display:    "flex",
            alignItems: "center",
            gap:        6,
            background: "none",
            border:     "1px solid var(--color-border)",
            borderRadius: 8,
            padding:    "5px 12px",
            cursor:     "pointer",
            fontSize:   11,
            fontWeight: 500,
            color:      "var(--color-text-muted)",
            flexShrink: 0,
          }}>
            <Upload size={13} />
            Upload documents
          </button>
        </div>

        {/* Graph area */}
        <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
          <DomainGraphCanvas
            data={data}
            domainId={domainId}
            onNodeSelect={handleNodeSelect}
          />
        </div>
      </div>
    </div>
  );
}
